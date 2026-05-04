import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QuizAnswers {
  gender?: string;
  occasion?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredFamily?: string;
  longevity?: string;
}

export interface ProductScore {
  productId: string;
  product: any; // We'll type this better later or keep it flexible
  totalScore: number;
  spm: number;
  bfs: number;
  qcs: number;
  rdf: number;
}

@Injectable()
export class AiScoringService {
  private readonly logger = new Logger(AiScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate scores for all active, in-stock products for a given user & quiz context.
   * Returns top N products sorted by score.
   */
  async calculateTopProducts(
    limit: number,
    userId?: string,
    quizAnswers?: QuizAnswers,
    providedDna?: { preferredNotes: string[]; avoidedNotes: string[]; riskLevel: number }
  ): Promise<ProductScore[]> {
    // 1. Fetch all products with at least 1 in-stock variant
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        variants: {
          some: { isActive: true, stock: { gt: 0 } },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        gender: true,
        longevity: true,
        concentration: true,
        isBestseller: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        scentFamily: { select: { name: true } },
        notes: { select: { note: { select: { name: true, type: true } } } },
        variants: {
          where: { isActive: true },
          select: { name: true, price: true, stock: true },
          orderBy: { price: 'asc' },
        },
        images: { select: { url: true }, take: 1 },
        reviews: { select: { rating: true } },
        reviewSummary: { select: { sentiment: true, summary: true } },
      },
    });

    if (!products.length) return [];

    // 2. Fetch User Behavioral Data & Preferences
    let orderedProductIds = new Set<string>();
    let favoritedProductIds = new Set<string>();
    let cartProductIds = new Set<string>();
    let userDna = providedDna;

    if (userId) {
      // Fetch History
      const [orders, favorites, carts, preference] = await Promise.all([
        this.prisma.orderItem.findMany({
          where: { order: { userId } },
          select: { variant: { select: { productId: true } } },
        }),
        this.prisma.favorite.findMany({
          where: { userId },
          select: { productId: true },
        }),
        this.prisma.cartItem.findMany({
          where: { cart: { userId } },
          select: { variant: { select: { productId: true } } },
        }),
        !userDna ? this.prisma.userAiPreference.findUnique({ where: { userId } }) : Promise.resolve(null),
      ]);

      orders.forEach((o) => orderedProductIds.add(o.variant.productId));
      favorites.forEach((f) => favoritedProductIds.add(f.productId));
      carts.forEach((c) => cartProductIds.add(c.variant.productId));

      if (!userDna && preference) {
        userDna = {
          preferredNotes: preference.preferredNotes,
          avoidedNotes: preference.avoidedNotes,
          riskLevel: preference.riskLevel,
        };
      }
    }

    const preferredNotesSet = new Set((userDna?.preferredNotes || []).map((n) => n.toLowerCase()));
    const avoidedNotesSet = new Set((userDna?.avoidedNotes || []).map((n) => n.toLowerCase()));
    const riskLevel = userDna?.riskLevel ?? 0.3;

    // 3. Calculate Scores
    const scoredProducts: ProductScore[] = [];

    for (const p of products) {
      let spm = 0; // Scent Profile Match
      let bfs = 0; // Behavioral Feedback Score
      let qcs = 0; // Quiz Context Score
      let rdf = 0; // Risk & Discovery Factor

      // --- 3.1. SPM ---
      let hasAvoidedNote = false;
      for (const pNote of p.notes) {
        const noteName = pNote.note.name.toLowerCase();
        if (avoidedNotesSet.has(noteName)) {
          hasAvoidedNote = true;
          break;
        }
        if (preferredNotesSet.has(noteName)) {
          spm += 15;
        }
      }

      if (hasAvoidedNote) {
        continue; // Completely exclude products with avoided notes
      }

      // Quiz also can provide preferredFamily
      if (quizAnswers?.preferredFamily && p.scentFamily?.name === quizAnswers.preferredFamily) {
        spm += 15;
      }

      // --- 3.2. BFS (45% Weight Emphasis) ---
      if (orderedProductIds.has(p.id)) bfs += 40;
      if (favoritedProductIds.has(p.id)) bfs += 20;
      if (cartProductIds.has(p.id)) bfs += 15;

      // Community Rating
      if (p.reviews.length > 0) {
        const avgRating = p.reviews.reduce((acc, curr) => acc + curr.rating, 0) / p.reviews.length;
        bfs += avgRating * 3; // Max 15
      }

      if (p.reviewSummary?.sentiment === 'POSITIVE') {
        bfs += 5;
      }

      // --- 3.3. QCS ---
      if (quizAnswers) {
        const minPrice = p.variants[0]?.price || 0;
        
        // Budget
        if (quizAnswers.budgetMin !== undefined && quizAnswers.budgetMax !== undefined) {
          if (minPrice >= quizAnswers.budgetMin && minPrice <= quizAnswers.budgetMax) {
            qcs += 15;
          } else if (minPrice < quizAnswers.budgetMin) {
            qcs += 5; // A bit cheaper is okay
          }
        }

        // Gender
        if (quizAnswers.gender) {
          if (p.gender === quizAnswers.gender) qcs += 10;
          else if (p.gender === 'UNISEX') qcs += 5;
        }

        // Longevity
        if (quizAnswers.longevity && p.longevity === quizAnswers.longevity) {
          qcs += 10;
        }
      }

      // --- 3.4. RDF ---
      if (riskLevel > 0.6 && !p.isBestseller) {
        // High risk users get bonus for non-bestsellers, let's say random up to 15 based on riskLevel
        const randomFactor = Math.random();
        rdf += Math.round(15 * riskLevel * randomFactor);
      }

      const totalScore = spm + bfs + qcs + rdf;

      scoredProducts.push({
        productId: p.id,
        product: p,
        totalScore,
        spm,
        bfs,
        qcs,
        rdf,
      });
    }

    // 4. Sort by score descending and return top N
    return scoredProducts.sort((a, b) => b.totalScore - a.totalScore).slice(0, limit);
  }
}
