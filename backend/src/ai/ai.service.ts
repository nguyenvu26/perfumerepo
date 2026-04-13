import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI;
  private model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-3-flash-preview';

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set – AI features will fail');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  // ──────────────────────────────────────────────────────
  // Review summarisation (called by ReviewsService)
  // ──────────────────────────────────────────────────────
  async summarizeProductReviews(productId: string): Promise<void> {
    try {
      const reviews = await this.prisma.review.findMany({
        where: { productId, isHidden: false },
        select: { rating: true, content: true },
        take: 100,
        orderBy: { createdAt: 'desc' },
      });

      if (reviews.length === 0) return;

      const reviewTexts = reviews
        .map((r) => `Rating: ${r.rating}/5. ${r.content ?? ''}`)
        .join('\n');

      const prompt = `Summarize the following product reviews.
Return a JSON object with keys: summary, pros, cons, keywords, sentiment.
Only return the JSON, no markdown fences.

Reviews:
${reviewTexts}`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text ?? '{}';
      let parsed: Record<string, string> = {};
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch {
        /* not valid JSON – use raw text */
      }

      await this.prisma.reviewSummary.upsert({
        where: { productId },
        create: {
          productId,
          summary: parsed.summary ?? text,
          pros: parsed.pros ?? '',
          cons: parsed.cons ?? '',
          keywords: parsed.keywords ?? '',
          sentiment: parsed.sentiment ?? 'NEUTRAL',
        },
        update: {
          summary: parsed.summary ?? text,
          pros: parsed.pros ?? '',
          cons: parsed.cons ?? '',
          keywords: parsed.keywords ?? '',
          sentiment: parsed.sentiment ?? 'NEUTRAL',
        },
      });
    } catch (error) {
      this.logger.error('Failed to summarize reviews', error);
    }
  }

  // ──────────────────────────────────────────────────────
  // Perfume Consultant (Customer & Staff AI)
  // ──────────────────────────────────────────────────────

  /** Simple in-memory cache so we don't query DB on every single message */
  private productCatalogCache: { data: string; expiresAt: number } | null =
    null;

  private async getProductCatalog(): Promise<string> {
    const now = Date.now();
    if (this.productCatalogCache && this.productCatalogCache.expiresAt > now) {
      return this.productCatalogCache.data;
    }

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        gender: true,
        longevity: true,
        concentration: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        scentFamily: { select: { name: true } },
        notes: {
          select: {
            note: { select: { name: true, type: true } },
          },
        },
        variants: {
          where: { isActive: true },
          select: { name: true, price: true, stock: true },
          orderBy: { price: 'asc' },
        },
      },
      take: 100, // limit to keep prompt manageable
    });

    const catalog = products
      .map((p) => {
        const prices = p.variants.map(
          (v) => `${v.name}: ${v.price.toLocaleString()}₫ (stock: ${v.stock})`,
        );
        const notes = p.notes.map(
          (n) => `${n.note.type}: ${n.note.name}`,
        );
        return [
          `[ID: ${p.id}] ${p.name}`,
          `  Brand: ${p.brand.name}`,
          p.category ? `  Category: ${p.category.name}` : null,
          p.scentFamily ? `  Scent Family: ${p.scentFamily.name}` : null,
          p.gender ? `  Gender: ${p.gender}` : null,
          p.concentration ? `  Concentration: ${p.concentration}` : null,
          p.longevity ? `  Longevity: ${p.longevity}` : null,
          notes.length > 0 ? `  Notes: ${notes.join(', ')}` : null,
          prices.length > 0 ? `  Variants: ${prices.join(' | ')}` : null,
          p.description ? `  Description: ${p.description.slice(0, 150)}` : null,
          `  URL slug: ${p.slug}`,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n');

    // Cache for 5 minutes
    this.productCatalogCache = { data: catalog, expiresAt: now + 5 * 60 * 1000 };
    return catalog;
  }

  async perfumeConsult(
    userMessage: string,
    history: Array<{ role: string; text: string }>,
    dna?: {
      preferredNotes: string[];
      avoidedNotes: string[];
      riskLevel: number;
    },
  ): Promise<string> {
    const catalog = await this.getProductCatalog();

    let dnaContext = '';
    if (dna) {
      dnaContext = `
═══════════════════════════════════════
USER SCENT DNA PROFILE:
- Preferred Notes: ${dna.preferredNotes.join(', ') || 'Any'}
- Avoided Notes (STRICT EXCLUSION): ${dna.avoidedNotes.join(', ') || 'None'}
- Adventure/Risk Level: ${dna.riskLevel} (0.0 = Very Safe, 1.0 = Very Bold)

ADVICE STRATEGY:
1. STRICTLY EXCLUDE any product that contains any of the "Avoided Notes".
2. PRIORITIZE products with "Preferred Notes".
3. If Adventure Level is LOW (< 0.4), recommend very safe, mass-appealing classics matching their preferred notes.
4. If Adventure Level is HIGH (> 0.7), suggest unique or challenging fragrance combinations that might push their boundaries but still avoid their excluded notes.
═══════════════════════════════════════
`;
    }

    const systemPrompt = `You are "PerfumeGPT", an expert fragrance consultant for our perfume store.
${dnaContext}

IMPORTANT RULES:
- You can ONLY recommend products that exist in our catalog below.
- NEVER invent product names or prices.
- Respond in the same language the user writes in (Vietnamese or English).
- When recommending products, return a JSON object:
  { "text": "<your warm explanation>", "recommendations": [{ "productId": "<actual ID>", "name": "<exact product name>", "reason": "<why this suits them>", "price": "<lowest variant price as number>" }] }
- If the question is general (e.g. greetings, fragrance knowledge), reply in plain text.
- Be concise, warm, and knowledgeable.
- If no products match the user's request, say so honestly and suggest alternatives from the catalog.

═══════════════════════════════════════
OUR PRODUCT CATALOG (${catalog ? 'available' : 'empty'}):
═══════════════════════════════════════
${catalog || '(No products currently in system)'}
═══════════════════════════════════════`;

    const contents = [
      systemPrompt,
      ...history.map((h) => `${h.role}: ${h.text}`),
      `USER: ${userMessage}`,
    ].join('\n');

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
    });

    return response.text ?? 'Sorry, I could not generate a response.';
  }

  // ──────────────────────────────────────────────────────
  // Marketing Advisor (Admin AI)
  // ──────────────────────────────────────────────────────
  async marketingAdvise(
    adminMessage: string,
    history: Array<{ role: string; text: string }>,
  ): Promise<string> {
    const systemPrompt = `You are "PerfumeGPT Marketing", a marketing advisor for a perfume shop.
Rules:
- Respond in the same language the admin writes in.
- Give actionable marketing insights, promotions ideas, and strategy tips.
- Be professional and data-oriented when possible.`;

    const contents = [
      systemPrompt,
      ...history.map((h) => `${h.role}: ${h.text}`),
      `ADMIN: ${adminMessage}`,
    ].join('\n');

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
    });

    return response.text ?? 'Sorry, I could not generate a response.';
  }

  // ──────────────────────────────────────────────────────
  // Quiz Consultant
  // ──────────────────────────────────────────────────────
  async quizConsult(answers: {
    gender?: string;
    occasion?: string;
    budgetMin?: number;
    budgetMax?: number;
    preferredFamily?: string;
    longevity?: string;
  }): Promise<Array<{ productId: string; name: string; reason: string; price: number }>> {
    const catalog = await this.getProductCatalog();

    const customerInfo: string[] = [];
    if (answers.gender) customerInfo.push(`Giới tính: ${answers.gender}`);
    if (answers.occasion) customerInfo.push(`Dịp sử dụng: ${answers.occasion}`);
    if (answers.budgetMin && answers.budgetMax) {
      customerInfo.push(`Ngân sách: ${answers.budgetMin.toLocaleString()} - ${answers.budgetMax.toLocaleString()} VND`);
    }
    if (answers.preferredFamily) customerInfo.push(`Gia đình hương: ${answers.preferredFamily}`);
    if (answers.longevity) customerInfo.push(`Thời gian lưu hương: ${answers.longevity}`);

    const prompt = `Bạn là chuyên gia tư vấn nước hoa tại PerfumeGPT. Khách hàng đã trả lời khảo sát với thông tin sau:

THÔNG TIN KHÁCH HÀNG:
${customerInfo.join('\n')}

DANH MỤC SẢN PHẨM:
${catalog}

YÊU CẦU:
- Chọn 3-5 sản phẩm phù hợp nhất dựa trên thông tin khách hàng.
- Ưu tiên: phù hợp giới tính, dịp sử dụng, ngân sách, gia đình hương, thời gian lưu hương.
- Trả kết quả dạng JSON array: [{"productId": "<ID từ catalog>", "name": "<tên chính xác>", "reason": "<giải thích ngắn gọn bằng tiếng Việt>", "price": <giá thấp nhất số>}].
- Chỉ trả JSON, không thêm text ngoài.`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    const text = response.text ?? '[]';
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
      }
    } catch (error) {
      this.logger.error('Failed to parse quiz AI response', error);
    }
    return [];
  }
}
