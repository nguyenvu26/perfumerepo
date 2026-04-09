import 'package:flutter/material.dart';
import 'app_theme.dart';

/// Standardized elevation & shadow tokens for the Lumina design system.
///
/// Usage:
/// ```dart
/// Container(
///   decoration: BoxDecoration(
///     boxShadow: AppShadows.card,
///     borderRadius: AppRadius.cardBorder,
///   ),
/// )
/// ```
class AppShadows {
  AppShadows._();

  /// Subtle card shadow — product cards, section cards.
  static List<BoxShadow> get card => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.04),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  /// Medium elevation — bottom sheets, floating elements, modals.
  static List<BoxShadow> get elevated => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.08),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  /// Soft inset — pressed/selected states.
  static List<BoxShadow> get soft => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.03),
      blurRadius: 4,
      offset: const Offset(0, 1),
    ),
  ];

  /// Gold glow — primary CTA buttons, highlighted actions.
  static List<BoxShadow> get goldGlow => [
    BoxShadow(
      color: AppTheme.accentGold.withValues(alpha: 0.3),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
}
