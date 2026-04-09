import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../../features/product/presentation/product_story_screen.dart';

class ProductStorySection extends StatefulWidget {
  final String? description;
  final String productId;
  final String productName;
  final String imageUrl;

  const ProductStorySection({
    super.key,
    this.description,
    required this.productId,
    required this.productName,
    required this.imageUrl,
  });

  @override
  State<ProductStorySection> createState() => _ProductStorySectionState();
}

class _ProductStorySectionState extends State<ProductStorySection> {
  bool _isExpanded = false;

  static const _fallback =
      'Before it was a perfume, it was the name of a rebel. A woman who changed the rules. '
      'This floral, and voluptuous fragrance is composed around four flowers: exotic Jasmine, '
      'fruity Ylang-Ylang, fresh Orange Blossom, and creamy Tuberose.';

  @override
  Widget build(BuildContext context) {
    final text = widget.description ?? _fallback;

    return Transform.translate(
      offset: const Offset(0, -30),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Section header ──────────────────────────────────────
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    'The Story',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ProductStoryScreen(
                        productId: widget.productId,
                        productName: widget.productName,
                        imageUrl: widget.imageUrl,
                      ),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Toàn bộ câu chuyện',
                        style: GoogleFonts.montserrat(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.accentGold,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.arrow_forward,
                        size: 12,
                        color: AppTheme.accentGold,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // ── Expandable body ─────────────────────────────────────
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 280),
              crossFadeState: _isExpanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              firstChild: Text(
                text,
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  height: 1.65,
                  color: AppTheme.deepCharcoal.withValues(alpha: 0.75),
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              secondChild: Text(
                text,
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  height: 1.65,
                  color: AppTheme.deepCharcoal.withValues(alpha: 0.75),
                ),
              ),
            ),
            const SizedBox(height: 8),

            // ── Expand / collapse toggle ────────────────────────────
            GestureDetector(
              onTap: () => setState(() => _isExpanded = !_isExpanded),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _isExpanded ? 'Thu gọn' : 'Đọc thêm',
                    style: GoogleFonts.montserrat(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.accentGold,
                    ),
                  ),
                  const SizedBox(width: 4),
                  AnimatedRotation(
                    turns: _isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: const Icon(
                      Icons.keyboard_arrow_down,
                      size: 14,
                      color: AppTheme.accentGold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
