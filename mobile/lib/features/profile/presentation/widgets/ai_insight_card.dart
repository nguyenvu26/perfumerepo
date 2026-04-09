import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/luxury_button.dart';

/// AI Insight Card - Olfactory Signature
///
/// Reusable card displaying user's AI-generated scent preferences.
/// Can be used on Profile, Home, or Onboarding screens.
///
/// Why this is extracted:
/// - Reusable across multiple screens
/// - Separates AI insight presentation from profile logic
/// - Makes it easy to A/B test different insight card designs
class AiInsightCard extends StatelessWidget {
  final List<String> olfactoryTags;
  final VoidCallback onFindNextScent;
  final VoidCallback onViewScentProfile;

  const AiInsightCard({
    super.key,
    required this.olfactoryTags,
    required this.onFindNextScent,
    required this.onViewScentProfile,
  });

  @override
  Widget build(BuildContext context) {
    // Show at most 3 tags to keep card compact
    final displayTags = olfactoryTags.take(3).toList();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.deepCharcoal,
        borderRadius: BorderRadius.circular(16),
        image: const DecorationImage(
          image: NetworkImage(
            'https://images.unsplash.com/photo-1541544181051-e46607bc22a4?w=800',
          ),
          fit: BoxFit.cover,
          opacity: 0.25,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badge row
          Row(
            children: [
              Icon(Icons.auto_awesome, color: AppTheme.accentGold, size: 13),
              const SizedBox(width: 5),
              Text(
                'PHÂN TÍCH AI',
                style: GoogleFonts.montserrat(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.3,
                  color: AppTheme.accentGold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Title
          Text(
            'Dấu ấn mùi hương của bạn',
            style: GoogleFonts.playfairDisplay(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          // Tags row — horizontal for compactness
          Row(
            children: [
              ...displayTags.map(
                (tag) => Padding(
                  padding: const EdgeInsets.only(right: 7),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 11,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      tag,
                      style: GoogleFonts.montserrat(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
              if (olfactoryTags.length > 3)
                Text(
                  '+${olfactoryTags.length - 3}',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          // CTA Row
          Row(
            children: [
              Expanded(
                child: LuxuryButton(
                  text: 'Tìm mùi hương tiếp theo',
                  onPressed: onFindNextScent,
                  trailingIcon: Icons.arrow_forward,
                  height: 40,
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: onViewScentProfile,
                child: Text(
                  'Xem thêm',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(alpha: 0.65),
                    decoration: TextDecoration.underline,
                    decorationColor: Colors.white.withValues(alpha: 0.45),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
