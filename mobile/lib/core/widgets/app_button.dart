import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../theme/app_radius.dart';

enum AppButtonVariant { primary, secondary, outline, text, danger }

/// Enhanced button replacing [LuxuryButton].
///
/// Supports five visual variants and keeps the same loading / icon API.
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool isLoading;
  final bool fullWidth;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final double? height;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.isLoading = false,
    this.fullWidth = true,
    this.leadingIcon,
    this.trailingIcon,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || isLoading;

    return SizedBox(
      height: height ?? 46,
      width: fullWidth ? double.infinity : null,
      child: _buildButton(isDisabled),
    );
  }

  Widget _buildButton(bool isDisabled) {
    switch (variant) {
      case AppButtonVariant.primary:
        return ElevatedButton(
          onPressed: isDisabled ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.accentGold,
            foregroundColor: AppTheme.primaryDb,
            disabledBackgroundColor: AppTheme.mutedSilver.withValues(
              alpha: 0.3,
            ),
            disabledForegroundColor: AppTheme.mutedSilver,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonBorder),
          ),
          child: _buildChild(AppTheme.primaryDb),
        );

      case AppButtonVariant.secondary:
        return ElevatedButton(
          onPressed: isDisabled ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.deepCharcoal,
            foregroundColor: Colors.white,
            disabledBackgroundColor: AppTheme.mutedSilver.withValues(
              alpha: 0.3,
            ),
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonBorder),
          ),
          child: _buildChild(Colors.white),
        );

      case AppButtonVariant.outline:
        return OutlinedButton(
          onPressed: isDisabled ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.accentGold,
            disabledForegroundColor: AppTheme.mutedSilver,
            side: BorderSide(
              color: isDisabled
                  ? AppTheme.mutedSilver.withValues(alpha: 0.3)
                  : AppTheme.accentGold.withValues(alpha: 0.6),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24),
            shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonBorder),
          ),
          child: _buildChild(
            isDisabled ? AppTheme.mutedSilver : AppTheme.accentGold,
          ),
        );

      case AppButtonVariant.text:
        return TextButton(
          onPressed: isDisabled ? null : onPressed,
          style: TextButton.styleFrom(
            foregroundColor: AppTheme.accentGold,
            disabledForegroundColor: AppTheme.mutedSilver,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonBorder),
          ),
          child: _buildChild(
            isDisabled ? AppTheme.mutedSilver : AppTheme.accentGold,
          ),
        );

      case AppButtonVariant.danger:
        return ElevatedButton(
          onPressed: isDisabled ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFF453A),
            foregroundColor: Colors.white,
            disabledBackgroundColor: AppTheme.mutedSilver.withValues(
              alpha: 0.3,
            ),
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonBorder),
          ),
          child: _buildChild(Colors.white),
        );
    }
  }

  Widget _buildChild(Color textColor) {
    if (isLoading) {
      return SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(textColor),
        ),
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (leadingIcon != null) ...[
          Icon(leadingIcon, size: 16, color: textColor),
          const SizedBox(width: 6),
        ],
        Flexible(
          child: Text(
            text,
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              height: 1.1,
              color: textColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (trailingIcon != null) ...[
          const SizedBox(width: 6),
          Icon(trailingIcon, size: 16, color: textColor),
        ],
      ],
    );
  }
}
