import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';

void showClearCartModal(
  BuildContext context, {
  required VoidCallback onClearConfirmed,
}) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (context) => ClearCartModal(onClearConfirmed: onClearConfirmed),
  );
}

class ClearCartModal extends StatelessWidget {
  final VoidCallback onClearConfirmed;

  const ClearCartModal({super.key, required this.onClearConfirmed});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle Bar
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.softTaupe,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),

            // Icon
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.shopping_cart_outlined,
                color: AppTheme.accentGold,
                size: 32,
              ),
            ),
            const SizedBox(height: 20),

            // Title
            Text(
              'Xóa toàn bộ giỏ hàng?',
              style: GoogleFonts.playfairDisplay(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(height: 8),

            // Subtitle
            Text(
              'Thao tác này sẽ xóa tất cả sản phẩm bạn đã chọn.',
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: AppTheme.mutedSilver,
              ),
            ),
            const SizedBox(height: 32),

            // Keep Items Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(
                    color: AppTheme.accentGold,
                    width: 1.5,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(26),
                  ),
                ),
                child: Text(
                  'Giữ lại sản phẩm',
                  style: GoogleFonts.montserrat(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.accentGold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Clear All Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: TextButton(
                onPressed: onClearConfirmed,
                style: TextButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(26),
                  ),
                ),
                child: Text(
                  'Xóa tất cả',
                  style: GoogleFonts.montserrat(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
