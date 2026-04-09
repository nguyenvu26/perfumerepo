import 'package:flutter/material.dart';

/// Standardized border radius tokens for the Lumina design system.
///
/// Usage:
/// ```dart
/// Container(
///   decoration: BoxDecoration(borderRadius: AppRadius.cardBorder),
/// )
/// ClipRRect(borderRadius: AppRadius.sheetBorder, child: ...)
/// ```
class AppRadius {
  AppRadius._();

  // --- Raw values ---
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double full = 999;

  // --- Semantic shortcuts ---
  static BorderRadius get cardBorder => BorderRadius.circular(md);
  static BorderRadius get buttonBorder => BorderRadius.circular(xl);
  static BorderRadius get inputBorder => BorderRadius.circular(sm);
  static BorderRadius get chipBorder => BorderRadius.circular(xl);
  static BorderRadius get avatarBorder => BorderRadius.circular(full);
  static BorderRadius get sheetBorder =>
      const BorderRadius.vertical(top: Radius.circular(lg));
}
