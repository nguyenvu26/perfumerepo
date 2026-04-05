import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_theme.dart';

/// Centralized text style definitions.
///
/// Two canonical font families:
///   - **Playfair Display** — luxury display: screen titles, product names,
///     section headings, price highlights.
///   - **Montserrat** — functional sans-serif: body copy, labels, captions,
///     button text, input hints.
///
/// Usage:
/// ```dart
/// Text('Title', style: AppTextStyle.titleLg())
/// Text('Label', style: AppTextStyle.labelMd(color: AppTheme.mutedSilver))
/// Text('Body',  style: AppTextStyle.bodyMd().copyWith(height: 1.6))
/// ```
abstract class AppTextStyle {
  AppTextStyle._();

  // ── PLAYFAIR DISPLAY (display / heading / price) ──────────────────────────

  /// 28px · w600 — Page title, hero heading
  static TextStyle displayLg({Color? color}) => GoogleFonts.playfairDisplay(
    fontSize: 28,
    fontWeight: FontWeight.w600,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 22px · w600 — Section heading, empty-state title
  static TextStyle displayMd({Color? color}) => GoogleFonts.playfairDisplay(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 18px · w600 — AppBar title, dialog heading
  static TextStyle displaySm({Color? color}) => GoogleFonts.playfairDisplay(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 32px · w700 — Large price / total highlight
  static TextStyle priceLg({Color? color}) => GoogleFonts.playfairDisplay(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 22px · w700 — Medium price
  static TextStyle priceMd({Color? color}) => GoogleFonts.playfairDisplay(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 20px · w700 — Small price / inline price total
  static TextStyle priceSm({Color? color}) => GoogleFonts.playfairDisplay(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 17px · w600 — Card title, section item title
  static TextStyle titleLg({Color? color}) => GoogleFonts.playfairDisplay(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 15px · w600 — List item title (e.g. product name in tile)
  static TextStyle titleMd({Color? color}) => GoogleFonts.playfairDisplay(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    height: 1.3,
    color: color ?? AppTheme.deepCharcoal,
  );

  // ── MONTSERRAT (body / label / caption) ──────────────────────────────────

  /// 16px · w400 — Body large
  static TextStyle bodyLg({Color? color}) => GoogleFonts.montserrat(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 14px · w400 — Body medium (reading, descriptions)
  static TextStyle bodyMd({Color? color}) => GoogleFonts.montserrat(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.6,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 13px · w400 — Body small / secondary text
  static TextStyle bodySm({Color? color}) => GoogleFonts.montserrat(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: color ?? AppTheme.mutedSilver,
  );

  /// 13px · w600 — UI label large (tile title, form label)
  static TextStyle labelLg({Color? color}) => GoogleFonts.montserrat(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 12px · w600 — UI label medium
  static TextStyle labelMd({Color? color}) => GoogleFonts.montserrat(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 11px · w500 — UI label small (tags, chips)
  static TextStyle labelSm({Color? color}) => GoogleFonts.montserrat(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    color: color ?? AppTheme.deepCharcoal,
  );

  /// 10px · w600 — Label extra small (section headers, badges)
  static TextStyle labelXs({Color? color, double letterSpacing = 0.8}) =>
      GoogleFonts.montserrat(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: letterSpacing,
        color: color ?? AppTheme.mutedSilver,
      );

  /// 11px · w400 — Caption / timestamp / helper text
  static TextStyle caption({Color? color}) => GoogleFonts.montserrat(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: color ?? AppTheme.mutedSilver,
  );

  /// 13px · w400 italic — Photo captions, editorial notes
  static TextStyle captionItalic({Color? color}) => GoogleFonts.montserrat(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    fontStyle: FontStyle.italic,
    color: color ?? AppTheme.mutedSilver,
  );

  /// 12px · w500 — Button text (secondary/outline buttons)
  static TextStyle button({Color? color}) => GoogleFonts.montserrat(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    color: color ?? AppTheme.deepCharcoal,
  );
}
