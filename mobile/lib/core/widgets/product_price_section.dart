import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../utils/currency_utils.dart';

/// Displays the product price prominently above the fold.
/// Uses the same -30 Transform.translate cascade as neighbouring section cards.
class ProductPriceSection extends StatelessWidget {
  final double price;

  const ProductPriceSection({super.key, required this.price});

  @override
  Widget build(BuildContext context) {
    return Transform.translate(
      offset: const Offset(0, -30),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'GIÁ NIÊM YẾT',
              style: GoogleFonts.montserrat(
                fontSize: 9,
                letterSpacing: 1.5,
                fontWeight: FontWeight.w600,
                color: AppTheme.mutedSilver,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              formatVND(price),
              style: GoogleFonts.montserrat(
                fontSize: 38,
                fontWeight: FontWeight.w700,
                color: AppTheme.deepCharcoal,
                height: 1,
                letterSpacing: -1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
