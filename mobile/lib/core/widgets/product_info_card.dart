import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../../features/product/models/product.dart';

class ProductInfoCard extends StatelessWidget {
  final Product product;
  final Animation<double> animation;
  final VoidCallback onOpenReviews;

  const ProductInfoCard({
    super.key,
    required this.product,
    required this.animation,
    required this.onOpenReviews,
  });

  @override
  Widget build(BuildContext context) {
    final heroHeight = MediaQuery.of(context).size.height * 0.55;

    return Positioned(
      top: heroHeight - 80, // 🔥 QUAN TRỌNG: đè NGAY từ đầu
      left: 16,
      right: 16,
      child: FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position:
              Tween<Offset>(
                begin: const Offset(0, 0.12),
                end: Offset.zero,
              ).animate(
                CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
              ),
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 40,
                  offset: const Offset(0, 16),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // BRAND
                Text(
                  product.brand.toUpperCase(),
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.accentGold,
                  ),
                ),
                const SizedBox(height: 6),

                // NAME
                Text(
                  product.name,
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    height: 1.15,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                const SizedBox(height: 4),

                // SUBTITLE
                Text(
                  'Eau de Parfum',
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    color: AppTheme.mutedSilver,
                  ),
                ),

                const SizedBox(height: 12),

                // RATING
                if (product.rating != null)
                  GestureDetector(
                    onTap: onOpenReviews,
                    child: Row(
                      children: [
                        const Icon(
                          Icons.star,
                          size: 14,
                          color: AppTheme.accentGold,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${product.rating}',
                          style: GoogleFonts.montserrat(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.deepCharcoal,
                          ),
                        ),
                        if (product.reviews != null) ...[
                          const SizedBox(width: 6),
                          Text(
                            '(${product.reviews} reviews)',
                            style: GoogleFonts.montserrat(
                              fontSize: 12,
                              color: AppTheme.mutedSilver,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                        const Spacer(),
                        const Icon(
                          Icons.arrow_forward_ios,
                          size: 14,
                          color: AppTheme.mutedSilver,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
