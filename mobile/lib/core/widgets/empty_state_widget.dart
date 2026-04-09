import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

/// Empty State Widget
/// 
/// Reusable component for displaying empty states across the app.
/// Replaces duplicated empty state implementations.
/// 
/// Usage:
/// ```dart
/// EmptyStateWidget(
///   icon: Icons.shopping_cart_outlined,
///   title: 'Your cart is empty',
///   subtitle: 'Add items to get started',
///   action: LuxuryButton(
///     text: 'Start Shopping',
///     onPressed: () => context.push(AppRoutes.explore),
///   ),
/// )
/// ```
class EmptyStateWidget extends StatelessWidget {
  /// Icon to display at the top
  final IconData icon;
  
  /// Main title text
  final String title;
  
  /// Subtitle/description text
  final String subtitle;
  
  /// Optional action button
  final Widget? action;
  
  /// Icon size (default: 64)
  final double iconSize;
  
  /// Icon color (default: muted gold)
  final Color? iconColor;

  const EmptyStateWidget({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.action,
    this.iconSize = 64.0,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 60),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Icon(
              icon,
              size: iconSize,
              color: iconColor ?? AppTheme.accentGold.withValues(alpha: 0.3),
            ),
            
            const SizedBox(height: 24),
            
            // Title
            Text(
              title,
              style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepCharcoal,
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 12),
            
            // Subtitle
            Text(
              subtitle,
              style: GoogleFonts.montserrat(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: AppTheme.mutedSilver,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            
            // Optional action button
            if (action != null) ...[
              const SizedBox(height: 32),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
