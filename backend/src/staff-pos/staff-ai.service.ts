import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';

export interface StaffAiConsultRequest {
    gender?: string;     // "male" | "female" | "unisex"
    occasion?: string;   // e.g. "date", "office", "daily", "party", "gift"
    budget?: number;     // max budget in VND
    notes?: string;      // free-text from staff
    storeId?: string;    // specific store to filter stock
}

export interface AiRecommendation {
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    price: number;
    stock: number;
    reason: string;
    imageUrl?: string;
}

@Injectable()
export class StaffAiService {
    private readonly logger = new Logger(StaffAiService.name);
    private readonly genAI: GoogleGenAI;
    private readonly modelName: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {
        const apiKey = this.config.get<string>('GEMINI_API_KEY', '');
        this.modelName = this.config.get<string>('GEMINI_MODEL', 'gemini-3-flash-preview');
        this.genAI = new GoogleGenAI({ apiKey });
    }
    async consultForStaff(
        staffUserId: string,
        req: StaffAiConsultRequest,
    ): Promise<{ recommendations: AiRecommendation[]; rawResponse: string }> {
        // 1. Fetch available products from DB (filtered by store stock)
        const products = await this.prisma.product.findMany({
            where: {
                isActive: true,
                variants: {
                    some: {
                        isActive: true,
                        ...(req.storeId ? {
                            storeStocks: {
                                some: {
                                    storeId: req.storeId,
                                    quantity: { gt: 0 }
                                }
                            }
                        } : {
                            stock: { gt: 0 }
                        })
                    }
                }
            },
            include: {
                brand: true,
                scentFamily: true,
                variants: {
                    where: {
                        isActive: true,
                        ...(req.storeId ? {
                            storeStocks: {
                                some: {
                                    storeId: req.storeId,
                                    quantity: { gt: 0 }
                                }
                            }
                        } : {
                            stock: { gt: 0 }
                        })
                    },
                    include: {
                        storeStocks: {
                            where: req.storeId ? { storeId: req.storeId } : undefined
                        }
                    }
                },
                notes: { include: { note: true } },
                images: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 80, // Limit to 80 for faster processing
        });

        // Build a COMPACT catalog to save tokens and avoid timeouts
        const catalog = products
            .map((p) => {
                const variantInfo = p.variants.map((v) => {
                    const stock = req.storeId
                        ? v.storeStocks.find(ss => ss.storeId === req.storeId)?.quantity ?? 0
                        : v.stock;
                    return `ID:${v.id} | ${v.name} | ${v.price.toLocaleString()}VND | Stock:${stock}`;
                }).join('; ');

                const notes = p.notes.map(n => n.note.name).slice(0, 5).join(', ');
                const mainImage = p.images?.[0]?.url || '';

                return `[PRODUCT ID: ${p.id}]
Name: ${p.name}
Brand: ${p.brand?.name ?? 'Unknown'}
Gender: ${p.gender}
Notes: ${notes}
Image: ${mainImage}
Variants: ${variantInfo}`;
            })
            .join('\n---\n');

        // 2. Build prompt
        const prompt = this.buildPrompt(req, catalog);

        const startTime = Date.now();
        let rawResponse = '';

        try {
            // Using the GoogleGenAI style found in central AiService
            const result = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: prompt,
                generationConfig: {
                    temperature: 0.2, // Lower temperature for more stable JSON
                    topP: 0.8,
                    topK: 40,
                }
            } as any);

            rawResponse = result.text || '';
        } catch (err: any) {
            this.logger.error('AI Consultation SDK Error:', err.message);

            // Log FAILED status
            await this.prisma.aiRequestLog.create({
                data: {
                    userId: staffUserId,
                    type: 'STAFF_POS_CONSULT',
                    request: JSON.stringify(req),
                    response: null,
                    status: 'FAILED',
                    duration: Date.now() - startTime,
                    model: this.modelName,
                    errorMessage: err.message,
                },
            }).catch(() => { });

            throw new InternalServerErrorException(
                `AI consultation failed: ${err.message}`,
            );
        }

        // 4. Parse AI response
        const recommendations = await this.parseRecommendations(rawResponse);

        // 5. Log to AiRequestLog
        try {
            await this.prisma.aiRequestLog.create({
                data: {
                    userId: staffUserId,
                    type: 'STAFF_POS_CONSULT',
                    request: JSON.stringify(req),
                    response: rawResponse,
                    status: 'SUCCESS',
                    duration: Date.now() - startTime,
                    model: this.modelName,
                },
            });
        } catch (logErr) {
            this.logger.warn('Failed to log AI request (continuing):', logErr.message);
        }

        return { recommendations, rawResponse };
    }


    private buildPrompt(
        req: StaffAiConsultRequest,
        catalog: string,
    ): string {
        const customerInfo: string[] = [];
        if (req.gender) customerInfo.push(`- Giới tính: ${req.gender}`);
        if (req.occasion) customerInfo.push(`- Dịp sử dụng: ${req.occasion}`);
        if (req.budget)
            customerInfo.push(
                `- Ngân sách tối đa: ${req.budget.toLocaleString('vi-VN')} VND`,
            );
        if (req.notes) customerInfo.push(`- Ghi chú thêm từ nhân viên: ${req.notes}`);

        return `Bạn là "PerfumeGPT Expert", trợ lý tư vấn cao cấp hỗ trợ nhân viên bán hàng tại quầy. 
Nhiệm vụ của bạn là chọn đúng sản phẩm có sẵn trong kho của cửa hàng này để tư vấn cho khách.

THÔNG TIN KHÁCH HÀNG:
${customerInfo.join('\n')}

DANH MỤC SẢN PHẨM CÓ SẴN TẠI CỬA HÀNG:
${catalog || '(Không có sản phẩm nào phù hợp trong kho)'}

YÊU CẦU:
1. Chỉ được chọn tối đa 3 sản phẩm phù hợp nhất từ danh sách trên. TUYỆT ĐỐI không tự bịa tên hay ID sản phẩm.
2. Phải kiểm tra tồn kho (Stock) của từng variant. Không gợi ý sản phẩm có Stock: 0.
3. Trả về kết quả DUY NHẤT dưới dạng JSON array, ví dụ:
[
  {
    "productId": "p_id_here",
    "productName": "Tên sản phẩm",
    "variantId": "v_id_here",
    "variantName": "Tên variant",
    "price": 1200000,
    "stock": 15,
    "reason": "Giải thích ngắn gọn lý do chọn (tiếng Việt)",
    "imageUrl": "url_image_here"
  }
]
4. Không thêm bất kỳ văn bản nào ngoài JSON.`;
    }

    private async parseRecommendations(raw: string): Promise<AiRecommendation[]> {
        try {
            let jsonStr = raw;
            // Handle common AI prefixes/suffixes or markdown code blocks
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            const parsed = JSON.parse(jsonStr);
            if (!Array.isArray(parsed)) return [];

            const recs = parsed.slice(0, 3).map((item: any) => ({
                productId: item.productId || '',
                productName: item.productName || '',
                variantId: item.variantId || '',
                variantName: item.variantName || '',
                price: Number(item.price) || 0,
                stock: Number(item.stock) || 0,
                reason: item.reason || '',
                imageUrl: '', // Will be enriched
            }));

            // Enrich with real images from DB
            const productIds = recs.map(r => r.productId).filter(Boolean);
            if (productIds.length > 0) {
                const products = await this.prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: {
                        id: true,
                        images: { take: 1, select: { url: true } },
                    }
                });
                const imgMap = new Map(products.map(p => [p.id, p.images[0]?.url]));
                recs.forEach(r => {
                    r.imageUrl = imgMap.get(r.productId) || '';
                });
            }

            return recs.filter((r) => r.productId && r.variantId);
        } catch (e) {
            this.logger.error('Failed to parse AI JSON:', e.message);
            return [];
        }
    }
}


