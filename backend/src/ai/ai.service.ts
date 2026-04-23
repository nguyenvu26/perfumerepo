import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

interface CatalogData {
  /** Products with at least one variant in stock */
  inStockCatalog: string;
  /** Products where ALL variants are out of stock */
  outOfStockCatalog: string;
  /** Total counts for prompt context */
  inStockCount: number;
  outOfStockCount: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI;
  private model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-3-flash-preview';

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set – AI features will fail');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async logRequest(
    userId: string | null,
    type: string,
    request: any,
    response: string | null,
    status: 'SUCCESS' | 'FAILED',
    duration?: number,
    errorMessage?: string,
  ) {
    try {
      await this.prisma.aiRequestLog.create({
        data: {
          userId,
          type,
          request: typeof request === 'string' ? request : JSON.stringify(request),
          response,
          status,
          duration,
          model: this.model,
          errorMessage,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log AI request [${type}]`, error.message);
    }
  }

  // ──────────────────────────────────────────────────────
  // Review summarisation (called by ReviewsService)
  // ──────────────────────────────────────────────────────
  async summarizeProductReviews(productId: string): Promise<void> {
    const startTime = Date.now();
    try {
      const reviews = await this.prisma.review.findMany({
        where: { productId, isHidden: false },
        select: { rating: true, content: true },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      if (reviews.length < 3) return;

      const reviewTexts = reviews
        .map((r) => `[Rating: ${r.rating}/5] ${r.content ?? '(No text)'}`)
        .join('\n');

      const prompt = `You are an expert fragrance critic. Summarize the following customer reviews for a perfume.
Return a JSON object with the following structure:
{
  "summary": "A concise paragraph (2-3 sentences) summarizing the overall sentiment in Vietnamese",
  "pros": "Bulleted list of pros in Vietnamese",
  "cons": "Bulleted list of cons in Vietnamese",
  "keywords": "Comma-separated keywords (scent notes, performance, etc.)",
  "sentiment": "POSITIVE", "NEGATIVE", or "NEUTRAL"
}

Reviews:
${reviewTexts}`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text || '';
      let parsed: any = null;

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        this.logger.error('Failed to parse AI JSON response', e);
      }

      if (parsed) {
        await this.prisma.reviewSummary.upsert({
          where: { productId },
          create: {
            productId,
            summary: parsed.summary || text.slice(0, 500),
            pros: parsed.pros || '',
            cons: parsed.cons || '',
            keywords: parsed.keywords || '',
            sentiment: parsed.sentiment || 'NEUTRAL',
          },
          update: {
            summary: parsed.summary || text.slice(0, 500),
            pros: parsed.pros || '',
            cons: parsed.cons || '',
            keywords: parsed.keywords || '',
            sentiment: parsed.sentiment || 'NEUTRAL',
          },
        });
        this.logger.log(`Updated AI summary for product ${productId}`);
      }

      await this.logRequest(
        null,
        'REVIEW_SUMMARY',
        { productId, reviewCount: reviews.length },
        text,
        'SUCCESS',
        Date.now() - startTime,
      );
    } catch (error) {
      this.logger.error('Failed to summarize reviews', error);
      await this.logRequest(
        null,
        'REVIEW_SUMMARY',
        { productId },
        null,
        'FAILED',
        Date.now() - startTime,
        error.message,
      );
    }
  }

  // ──────────────────────────────────────────────────────
  // Perfume Consultant (Customer & Staff AI)
  // ──────────────────────────────────────────────────────

  /** Simple in-memory cache so we don't query DB on every single message */
  private productCatalogCache: { data: CatalogData; expiresAt: number } | null =
    null;

  /**
   * Upgraded: Splits catalog into IN-STOCK and OUT-OF-STOCK lists.
   * Only products with at least one active variant with stock > 0 are
   * considered "in stock". Fully out-of-stock products go into a separate
   * list so the AI can apologise and suggest alternatives.
   */
  private async getProductCatalog(): Promise<CatalogData> {
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

    // ── Partition into in-stock vs out-of-stock ──
    const inStockProducts: typeof products = [];
    const outOfStockProducts: typeof products = [];

    for (const p of products) {
      const hasStock = p.variants.some((v) => v.stock > 0);
      if (hasStock) {
        inStockProducts.push(p);
      } else {
        outOfStockProducts.push(p);
      }
    }

    // ── Format helper ──
    const formatProduct = (p: (typeof products)[0], includeStock: boolean) => {
      const prices = p.variants.map((v) => {
        const stockInfo = includeStock ? ` (còn ${v.stock} sản phẩm)` : '';
        return `${v.name}: ${v.price.toLocaleString()}₫${stockInfo}`;
      });
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
    };

    const inStockCatalog = inStockProducts
      .map((p) => formatProduct(p, true))
      .join('\n\n');

    const outOfStockCatalog = outOfStockProducts
      .map((p) => formatProduct(p, false))
      .join('\n\n');

    const catalogData: CatalogData = {
      inStockCatalog,
      outOfStockCatalog,
      inStockCount: inStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
    };

    // Cache for 5 minutes
    this.productCatalogCache = {
      data: catalogData,
      expiresAt: now + 5 * 60 * 1000,
    };
    return catalogData;
  }

  // ──────────────────────────────────────────────────────
  // Post-check: Validate AI recommendations against DB
  // ──────────────────────────────────────────────────────

  /**
   * After the AI returns a JSON response with recommendations, this method
   * cross-checks each recommended productId against the live database to
   * ensure the product actually exists and has stock > 0.
   *
   * - Removes out-of-stock or invalid recommendations.
   * - If any were removed, appends a note explaining the removal and
   *   suggests the user ask for alternatives.
   */
  private async postCheckRecommendations(
    aiResponseText: string,
  ): Promise<string> {
    // Try to extract JSON from the AI response
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Not a recommendation response – return as-is
      return aiResponseText;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return aiResponseText;
    }

    if (
      !parsed.recommendations ||
      !Array.isArray(parsed.recommendations) ||
      parsed.recommendations.length === 0
    ) {
      return aiResponseText;
    }

    const productIds: string[] = parsed.recommendations
      .map((r: any) => r.productId)
      .filter(Boolean);

    if (productIds.length === 0) return aiResponseText;

    // ── Live DB check ──
    const validProducts = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        variants: {
          some: {
            isActive: true,
            stock: { gt: 0 },
          },
        },
      },
      select: { id: true },
    });

    const validIds = new Set(validProducts.map((p) => p.id));
    const originalCount = parsed.recommendations.length;

    // Filter out invalid/out-of-stock recommendations
    const removedItems: any[] = [];
    parsed.recommendations = parsed.recommendations.filter((r: any) => {
      if (validIds.has(r.productId)) {
        return true;
      }
      removedItems.push(r);
      return false;
    });

    // If nothing was removed, return original response
    if (removedItems.length === 0) return aiResponseText;

    this.logger.warn(
      `Post-check removed ${removedItems.length} out-of-stock recommendation(s): ${removedItems.map((r) => r.name || r.productId).join(', ')}`,
    );

    // Append a note about removed items
    const removedNames = removedItems
      .map((r) => r.name || 'Unknown')
      .join(', ');

    if (parsed.recommendations.length === 0) {
      // All recommendations were invalid – tell the user
      parsed.text =
        `Rất tiếc, các sản phẩm mà tôi định gợi ý (${removedNames}) hiện đã hết hàng. ` +
        `Xin hãy cho tôi biết thêm về sở thích của bạn để tôi tìm những lựa chọn thay thế phù hợp nhất!`;
      parsed.recommendations = [];
    } else {
      // Some were removed – note it
      parsed.text +=
        `\n\n⚠️ Lưu ý: Sản phẩm ${removedNames} hiện đã hết hàng nên tôi đã loại khỏi danh sách gợi ý.`;
    }

    // Reconstruct the response with the validated JSON
    const beforeJson = aiResponseText.slice(
      0,
      aiResponseText.indexOf(jsonMatch[0]),
    );
    const afterJson = aiResponseText.slice(
      aiResponseText.indexOf(jsonMatch[0]) + jsonMatch[0].length,
    );
    return beforeJson + JSON.stringify(parsed) + afterJson;
  }

  async perfumeConsult(
    userMessage: string,
    history: Array<{ role: string; text: string }>,
    userId?: string,
    dna?: {
      preferredNotes: string[];
      avoidedNotes: string[];
      riskLevel: number;
    },
  ): Promise<string> {
    const startTime = Date.now();
    try {
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

    const systemPrompt = `You are "PerfumeGPT", an expert fragrance consultant for our luxury perfume store.
${dnaContext}

╔══════════════════════════════════════════════════════════╗
║               CRITICAL STOCK RULES                       ║
╚══════════════════════════════════════════════════════════╝

1. You can ONLY recommend products from the "IN-STOCK CATALOG" below.
2. NEVER recommend products from the "OUT-OF-STOCK LIST" as available products.
3. If a customer asks about a specific product that is in the OUT-OF-STOCK LIST:
   a. Politely inform them the product is currently out of stock.
   b. IMMEDIATELY suggest 3-5 ALTERNATIVE products from the IN-STOCK CATALOG that share the SAME or SIMILAR:
      - Scent Family (Họ hương)
      - Top/Middle/Base Notes (Nốt hương)
      - Gender target
      - Concentration type
      - Price range
   c. Explain WHY each alternative is a good substitute (e.g., "Cùng họ hương Woody-Spicy, có nốt hương Vetiver tương tự...").
4. NEVER invent product names, IDs, or prices.
5. If no suitable alternatives exist in stock, say so honestly.

╔══════════════════════════════════════════════════════════╗
║               RESPONSE FORMAT                            ║
╚══════════════════════════════════════════════════════════╝

- Respond in the same language the user writes in (Vietnamese or English).
- When recommending products, you MUST return a JSON object:
  {
    "text": "<your warm, expert explanation>",
    "recommendations": [
      {
        "productId": "<exact ID from IN-STOCK catalog>",
        "name": "<exact product name>",
        "reason": "<why this suits them, mentioning scent family/notes>",
        "price": <lowest variant price as number>
      }
    ]
  }
- If the question is general (e.g. greetings, fragrance knowledge), reply in plain text only.
- Be concise, warm, and knowledgeable – speak like a luxury fragrance house advisor.

╔══════════════════════════════════════════════════════════╗
║  FALLBACK & ALTERNATIVE LOGIC (When products are OOS)    ║
╚══════════════════════════════════════════════════════════╝

When a customer requests a product that is OUT OF STOCK, follow this priority:
  Priority 1: Same Scent Family + Similar Notes → Best match
  Priority 2: Same Scent Family + Different Notes → Good match
  Priority 3: Related Scent Family (e.g., Woody → Woody-Spicy) + Similar Notes → Acceptable
  Priority 4: Same Gender + Same Concentration + Similar Price → Last resort

Always explain the substitution logic to the customer so they feel confident.

═══════════════════════════════════════
IN-STOCK CATALOG (${catalog.inStockCount} products available for recommendation):
═══════════════════════════════════════
${catalog.inStockCatalog || '(No products currently in stock)'}

═══════════════════════════════════════
OUT-OF-STOCK LIST (${catalog.outOfStockCount} products – DO NOT recommend these as available):
═══════════════════════════════════════
${catalog.outOfStockCatalog || '(None)'}
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

      const responseText = response.text ?? 'Sorry, I could not generate a response.';

      await this.logRequest(
        userId || null,
        'PERFUME_CONSULT',
        { message: userMessage, historyLength: history.length, hasDna: !!dna },
        responseText,
        'SUCCESS',
        Date.now() - startTime,
      );

      return responseText;
    } catch (error) {
      this.logger.error('Failed to generate AI consultation', error);
      await this.logRequest(
        userId || null,
        'PERFUME_CONSULT',
        { message: userMessage },
        null,
        'FAILED',
        Date.now() - startTime,
        error.message,
      );
      return 'Sorry, I encountered an error. Please try again later.';
    }
  }

  // ──────────────────────────────────────────────────────
  // Marketing Advisor (Admin AI)
  // ──────────────────────────────────────────────────────
  async marketingAdvise(
    adminMessage: string,
    history: Array<{ role: string; text: string }>,
    adminUserId?: string,
  ): Promise<string> {
    const startTime = Date.now();
    let contextStr = '';
    try {
      const [overview, topProducts, lowStock] = await Promise.all([
        this.analyticsService.getOverview(),
        this.analyticsService.getTopProducts(10),
        this.analyticsService.getLowStockItems(10),
      ]);

      const topProductsStr = topProducts
        .map(
          (p) =>
            `- ${p.productName} (Đã bán: ${p.totalQuantity}, Doanh thu: ${p.totalRevenue.toLocaleString()} VND)`
        )
        .join('\n');

      const lowStockStr = lowStock
        .map(
          (p) =>
            `- ${p.productName} [${p.variantName}] - Chú ý: Chỉ còn ${p.stock} sản phẩm!`
        )
        .join('\n');

      contextStr = `
CURRENT STORE DATA (Last 30 Days):
- Total Revenue: ${overview.totalRevenue.toLocaleString()} VND
- Total Orders: ${overview.totalOrders}
- Completed Orders: ${overview.completedOrders}
- Cancelled Orders: ${overview.cancelledOrders}
- New Customers Today: ${overview.newCustomersToday}
- AI Consultations: ${overview.aiConsultations}

TOP SELLING PRODUCTS (Last 30 Days):
${topProductsStr || 'No data'}

LOW STOCK ALERTS (Critical to restock):
${lowStockStr || 'No data'}
`;
    } catch (e) {
      this.logger.error('Failed to fetch analytics context for AI', e);
    }

    try {
      const systemPrompt = `You are "PerfumeGPT Marketing", an expert strategic business consultant, retail manager, and chief marketing advisor for a luxury perfume brand called "PerfumeGPT".
Your client is the Administrator (CEO) of the system.

${contextStr}

INSTRUCTIONS:
1. Base your strategies strictly on the provided real-time data above.
2. If the admin asks for restock advice, prioritize the "LOW STOCK ALERTS" and suggest ordering popular items from "TOP SELLING PRODUCTS".
3. If asked about marketing strategy, suggest campaigns around the top-selling products or clearance strategies for slow-moving stock (if any).
4. Always respond in a professional, high-end consulting tone (like a McKinsey/BCG consultant).
5. You must answer in the same language as the admin.
6. Format your advice clearly with bullet points, actionable steps, and data references. Make sure the numbers match system context exactly.`;

      const contents = [
        systemPrompt,
        ...history.map((h) => `${h.role}: ${h.text}`),
        `ADMIN: ${adminMessage}`,
      ].join('\n');

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents,
      });

      const responseText = response.text ?? 'Sorry, I could not generate a response.';

      await this.logRequest(
        adminUserId || null,
        'MARKETING_ADVISOR',
        { message: adminMessage },
        responseText,
        'SUCCESS',
        Date.now() - startTime,
      );

      return responseText;
    } catch (error) {
      this.logger.error('Failed to generate marketing advice', error);
      await this.logRequest(
        adminUserId || null,
        'MARKETING_ADVISOR',
        { message: adminMessage },
        null,
        'FAILED',
        Date.now() - startTime,
        error.message,
      );
      return 'Sorry, I encountered an error. Please try again later.';
    }
  }

  // ──────────────────────────────────────────────────────
  // Quiz Consultant
  // ──────────────────────────────────────────────────────
  async quizConsult(
    answers: {
      gender?: string;
      occasion?: string;
      budgetMin?: number;
      budgetMax?: number;
      preferredFamily?: string;
      longevity?: string;
    },
    userId?: string,
  ): Promise<{ analysis: string; recommendations: Array<{ productId: string; name: string; reason: string; price: number }> }> {
    const startTime = Date.now();
    try {
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

═══════════════════════════════════════
DANH MỤC SẢN PHẨM CÒN HÀNG (Chỉ chọn từ danh sách này):
═══════════════════════════════════════
${catalog.inStockCatalog}

═══════════════════════════════════════
SẢN PHẨM HẾT HÀNG (KHÔNG được chọn từ danh sách này):
═══════════════════════════════════════
${catalog.outOfStockCatalog || '(Không có)'}

YÊU CẦU:
- Chọn 3-5 sản phẩm phù hợp nhất dựa trên thông tin khách hàng.
- CHỈ ĐƯỢC CHỌN sản phẩm từ danh mục CÒN HÀNG. TUYỆT ĐỐI KHÔNG chọn sản phẩm hết hàng.
- Chiến lược: Nếu không tìm thấy sản phẩm khớp tất cả tiêu chí (đặc biệt là ngân sách thấp), hãy ưu tiên PHÙ HỢP HƠN về nhóm hương và dịp dùng, đồng thời giải thích rõ lý do.
- Trả kết quả dạng JSON object: {
    "analysis": "<Đoạn văn ngắn 2-3 câu phân tích hồ sơ mùi hương của khách hàng theo phong cách sang trọng, tinh tế>",
    "recommendations": [{"productId": "<ID từ catalog>", "name": "<tên chính xác>", "reason": "<giải thích ngắn gọn bằng tiếng Việt>", "price": <giá thấp nhất số>}]
  }
- Chỉ trả JSON, không thêm text ngoài.`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

    const text = response.text ?? '{}';
    let analysis = 'Dựa trên hồ sơ của bạn, chúng tôi đã tinh chọn những mùi hương phản chiếu đúng cá tính và không gian sống của bạn nhất.';
    let recommendations: Array<{ productId: string; name: string; reason: string; price: number }> = [];

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          analysis = parsed.analysis || analysis;
          recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [];
        }

        await this.logRequest(
          userId || null,
          'QUIZ_CONSULT',
          answers,
          text,
          recommendations.length > 0 ? 'SUCCESS' : 'FAILED',
          Date.now() - startTime,
        );
      } catch (error) {
        this.logger.error('Failed to parse quiz AI response', error);
      }

    // ── Post-check: Validate quiz recommendations against live DB ──
    if (recommendations.length > 0) {
      const productIds = recommendations.map((r) => r.productId).filter(Boolean);
      const validProducts = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
          variants: {
            some: {
              isActive: true,
              stock: { gt: 0 },
            },
          },
        },
        select: { id: true },
      });

      const validIds = new Set(validProducts.map((p) => p.id));
      const beforeCount = recommendations.length;

      recommendations = recommendations.filter((r) => validIds.has(r.productId));

      if (recommendations.length < beforeCount) {
        this.logger.warn(
          `Quiz post-check removed ${beforeCount - recommendations.length} out-of-stock recommendation(s)`,
        );
      }
    }

      return { analysis, recommendations };
    } catch (error) {
      this.logger.error('Failed during quiz consultation', error);
      return { 
        analysis: 'Hệ thống đang gặp gián đoạn nhỏ, nhưng chúng tôi vẫn tìm thấy những lựa chọn tuyệt vời cho bạn.', 
        recommendations: [] 
      };
    }
  }

  async generateProductScentAnalysis(productId: string): Promise<string> {
    const startTime = Date.now();
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          brand: true,
          notes: { include: { note: true } },
        },
      });

      if (!product) return '';

      const notesStr = product.notes
        .map((n) => `${n.note.type}: ${n.note.name}`)
        .join(', ');

      const prompt = `Bạn là một chuyên gia phê bình nước hoa cao cấp. Hãy viết một đoạn phân tích ngắn (khoảng 3-4 câu) về mùi hương của chai nước hoa này cho khách hàng.
Sản phẩm: ${product.name} của thương hiệu ${product.brand.name}.
Các nốt hương: ${notesStr}.
Mô tả: ${product.description || 'N/A'}.

YÊU CẦU:
- Văn phong sang trọng, tinh tế, giàu hình ảnh cảm xúc.
- Giải thích sự hòa quyện giữa các tầng hương mang lại trải nghiệm gì cho người dùng.
- Trả về nội dung bằng Tiếng Việt.
- Không dùng từ ngữ quá phổ thông, hãy làm khách hàng cảm thấy đây là một kiệt tác.
- Chỉ trả về đoạn văn bản phân tích, không thêm tiêu đề hay định dạng code block.`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const analysis = response.text || '';

      if (analysis) {
        await this.prisma.product.update({
          where: { id: productId },
          data: { scentAnalysis: analysis },
        });
      }

      await this.logRequest(
        null,
        'SCENT_ANALYSIS',
        { productId },
        analysis,
        analysis ? 'SUCCESS' : 'FAILED',
        Date.now() - startTime,
      );

      return analysis;
    } catch (error) {
      this.logger.error(
        `Failed to generate scent analysis for ${productId}`,
        error,
      );
      await this.logRequest(
        null,
        'SCENT_ANALYSIS',
        { productId },
        null,
        'FAILED',
        Date.now() - startTime,
        error.message,
      );
      return '';
    }
  }
}
