import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

export interface StaffAiConsultRequest {
    gender?: string;     // "male" | "female" | "unisex"
    occasion?: string;   // e.g. "date", "office", "daily", "party", "gift"
    budget?: number;     // max budget in VND
    notes?: string;      // free-text from staff
}

export interface AiRecommendation {
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    price: number;
    reason: string;
}

@Injectable()
export class StaffAiService {
    private readonly apiKey: string;
    private readonly model: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {
        this.apiKey = this.config.get<string>('GEMINI_API_KEY', '');
        this.model = this.config.get<string>('GEMINI_MODEL', 'gemini-3-flash-preview');
    }

    async consultForStaff(
        staffUserId: string,
        req: StaffAiConsultRequest,
    ): Promise<{ recommendations: AiRecommendation[]; rawResponse: string }> {
        // 1. Fetch available products from DB
        const products = await this.prisma.product.findMany({
            where: { isActive: true },
            include: {
                brand: true,
                scentFamily: true,
                variants: { where: { isActive: true, stock: { gt: 0 } } },
                notes: { include: { note: true } },
            },
            take: 100,
        });

        // Build catalog summary for AI
        const catalog = products
            .filter((p) => p.variants.length > 0)
            .map((p) => ({
                id: p.id,
                name: p.name,
                brand: p.brand?.name,
                gender: p.gender,
                scentFamily: p.scentFamily?.name,
                concentration: p.concentration,
                longevity: p.longevity,
                notes: p.notes.map((n) => `${n.note.type}: ${n.note.name}`).join(', '),
                variants: p.variants.map((v) => ({
                    id: v.id,
                    name: v.name,
                    price: v.price,
                    stock: v.stock,
                })),
            }));

        // 2. Build prompt
        const prompt = this.buildPrompt(req, catalog);

        // 3. Call Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        let rawResponse = '';

        try {
            const res = await axios.post(
                url,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    },
                },
                { timeout: 30000 },
            );

            rawResponse =
                res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        } catch (err: any) {
            console.error('AI Consultation Error:', err.response?.data || err.message);
            const message = err?.response?.data?.error?.message ?? err.message;
            throw new InternalServerErrorException(
                `AI consultation failed: ${message}`,
            );
        }

        // 4. Parse AI response
        const recommendations = this.parseRecommendations(rawResponse, catalog);

        // 5. Log to AiRequestLog
        await this.prisma.aiRequestLog.create({
            data: {
                userId: staffUserId,
                type: 'STAFF_POS_CONSULT',
                request: JSON.stringify(req),
                response: rawResponse,
                status: 'SUCCESS',
            },
        });

        return { recommendations, rawResponse };
    }

    private buildPrompt(
        req: StaffAiConsultRequest,
        catalog: any[],
    ): string {
        const customerInfo: string[] = [];
        if (req.gender) customerInfo.push(`Giới tính: ${req.gender}`);
        if (req.occasion) customerInfo.push(`Dịp sử dụng: ${req.occasion}`);
        if (req.budget)
            customerInfo.push(
                `Ngân sách tối đa: ${req.budget.toLocaleString('vi-VN')} VND`,
            );
        if (req.notes) customerInfo.push(`Ghi chú thêm: ${req.notes}`);

        return `Bạn là chuyên gia tư vấn nước hoa tại cửa hàng PerfumeGPT. Nhân viên bán hàng đang hỏi bạn gợi ý cho khách hàng.

THÔNG TIN KHÁCH HÀNG:
${customerInfo.join('\n')}

DANH MỤC SẢN PHẨM CÒN HÀNG (JSON):
${JSON.stringify(catalog, null, 0)}

YÊU CẦU:
- Chọn đúng 3 sản phẩm phù hợp nhất với khách, ưu tiên theo: phù hợp giới tính, dịp sử dụng, ngân sách, và tồn kho.
- Trả kết quả dạng JSON array, mỗi phần tử: {"productId": "...", "productName": "...", "variantId": "...", "variantName": "...", "price": ..., "reason": "..."}.
- "reason" phải giải thích ngắn gọn bằng tiếng Việt tại sao sản phẩm phù hợp.
- Chỉ trả JSON, không thêm text ngoài.`;
    }

    private parseRecommendations(
        raw: string,
        catalog: any[],
    ): AiRecommendation[] {
        try {
            // Extract JSON from markdown code block if present
            let jsonStr = raw;
            const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1].trim();
            }

            const parsed = JSON.parse(jsonStr);
            if (!Array.isArray(parsed)) {
                // Try to find an array in the string if direct parse fails
                const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    const fallbackParsed = JSON.parse(arrayMatch[0]);
                    if (Array.isArray(fallbackParsed)) return this.mapToRecommendations(fallbackParsed);
                }
                return [];
            }

            return this.mapToRecommendations(parsed);
        } catch (e) {
            // Try one more time to find anything that looks like an array
            try {
                const arrayMatch = raw.match(/\[[\s\S]*?\]/);
                if (arrayMatch) {
                    const fallbackParsed = JSON.parse(arrayMatch[0]);
                    if (Array.isArray(fallbackParsed)) return this.mapToRecommendations(fallbackParsed);
                }
            } catch {
                // Ultimate failure
            }
            return [];
        }
    }

    private mapToRecommendations(parsed: any[]): AiRecommendation[] {
        return parsed
            .slice(0, 5)
            .map((item: any) => ({
                productId: item.productId ?? '',
                productName: item.productName ?? '',
                variantId: item.variantId ?? '',
                variantName: item.variantName ?? '',
                price: Number(item.price) || 0,
                reason: item.reason ?? '',
            }))
            .filter((r: AiRecommendation) => r.productId);
    }
}
