import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../theme/app_spacing.dart';

/// Standardized error state widget for the Lumina design system.
///
/// Displays a user-friendly error message with an optional retry action.
/// Replaces inline error handling across screens to ensure consistent UX.
///
/// Usage:
/// ```dart
/// AppErrorWidget(
///   message: 'Không thể tải sản phẩm.',
///   onRetry: () => ref.invalidate(productsProvider),
/// )
/// ```
class AppErrorWidget extends StatelessWidget {
  /// User-friendly error message. Never show raw server/stack trace errors.
  final String message;

  /// Called when the user taps "Thử lại". If null, button is hidden.
  final VoidCallback? onRetry;

  /// Leading icon (default: error_outline_rounded).
  final IconData icon;

  const AppErrorWidget({
    super.key,
    required this.message,
    this.onRetry,
    this.icon = Icons.error_outline_rounded,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 60),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // --- Icon ---
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (isDark ? Colors.white : AppTheme.deepCharcoal)
                    .withValues(alpha: 0.05),
              ),
              child: Icon(icon, size: 36, color: AppTheme.mutedSilver),
            ),

            AppSpacing.vertLg,

            // --- Message ---
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                height: 1.5,
                color: isDark ? AppTheme.mutedSilver : const Color(0xFF6B6B6B),
              ),
            ),

            // --- Retry button ---
            if (onRetry != null) ...[
              AppSpacing.vertLg,
              SizedBox(
                height: 40,
                child: OutlinedButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: Text(
                    'Thử lại',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0.5,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.accentGold,
                    side: const BorderSide(color: AppTheme.accentGold),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
