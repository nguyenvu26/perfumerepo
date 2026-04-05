import 'package:flutter/material.dart';

/// Standardized spacing tokens for the Lumina design system.
///
/// Usage:
/// ```dart
/// Padding(padding: AppSpacing.screenH, child: ...)
/// Column(children: [widget, AppSpacing.vertMd, widget])
/// ```
class AppSpacing {
  AppSpacing._();

  // --- Raw values (multiples of 4) ---
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;

  // --- Semantic aliases ---
  static const double cardPadding = md;
  static const double sectionGap = lg;
  static const double screenPadding = md;
  static const double listItemGap = sm;
  static const double inputSpacing = md;

  // --- EdgeInsets shortcuts ---
  static const EdgeInsets screenH = EdgeInsets.symmetric(horizontal: md);
  static const EdgeInsets screenAll = EdgeInsets.all(md);
  static const EdgeInsets cardInner = EdgeInsets.all(md);
  static const EdgeInsets sectionPadding = EdgeInsets.symmetric(
    horizontal: md,
    vertical: lg,
  );

  // --- Vertical SizedBox shortcuts ---
  static const SizedBox vertXxs = SizedBox(height: xxs);
  static const SizedBox vertXs = SizedBox(height: xs);
  static const SizedBox vertSm = SizedBox(height: sm);
  static const SizedBox vertMd = SizedBox(height: md);
  static const SizedBox vertLg = SizedBox(height: lg);
  static const SizedBox vertXl = SizedBox(height: xl);

  // --- Horizontal SizedBox shortcuts ---
  static const SizedBox horzXs = SizedBox(width: xs);
  static const SizedBox horzSm = SizedBox(width: sm);
  static const SizedBox horzMd = SizedBox(width: md);
  static const SizedBox horzLg = SizedBox(width: lg);
}
