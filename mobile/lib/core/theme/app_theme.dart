import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // --- CORE PALETTE ---
  static const Color primaryDb = Color(0xFF030303); // Deep Black
  static const Color charcoal = Color(0xFF0F0F0F); // Elegant Charcoal
  static const Color champagneGold = Color(0xFFE2D1B3); // Sophisticated Gold
  static const Color accentGold = Color(0xFFD4AF37); // Classic Gold
  static const Color pearlWhite = Color(0xFFF5F5F7); // Apple-style white
  static const Color mutedSilver = Color(0xFF8E8E93); // Muted luxury text

  // --- LUXURY PERFUME PALETTE ---
  static const Color ivoryBackground = Color(
    0xFFF5F1ED,
  ); // Soft cream background
  static const Color creamWhite = Color(0xFFFAF8F5); // Warm white
  static const Color softTaupe = Color(0xFFE8E0D5); // Subtle border color
  static const Color deepCharcoal = Color(0xFF1A1A1A); // Rich text color

  // --- GLASSMORPHISM ---
  static const Color glassWhite = Color(0x0DFFFFFF); // 5% White
  static const Color glassBorder = Color(0x1AFFFFFF); // 10% White

  // --- DYNAMIC UTILS ---
  static LinearGradient getLuxuryGradient(Brightness brightness) {
    return brightness == Brightness.dark
        ? const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [charcoal, primaryDb],
          )
        : const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFFFFFF), pearlWhite],
          );
  }

  static LinearGradient getGoldGradient() {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [champagneGold, accentGold],
    );
  }

  static ThemeData darkTheme = _buildTheme(Brightness.dark);
  static ThemeData lightTheme = _buildTheme(Brightness.light);

  static ThemeData _buildTheme(Brightness brightness) {
    bool isDark = brightness == Brightness.dark;

    // Core dynamic colors
    Color bg = isDark ? primaryDb : ivoryBackground;
    Color surface = isDark ? charcoal : creamWhite;
    Color textColor = isDark ? pearlWhite : deepCharcoal;
    Color subTextColor = isDark ? mutedSilver : const Color(0xFF6B6B6B);

    // Glass effect refinement
    Color glassBg = isDark
        ? const Color(0x0DFFFFFF)
        : const Color(0xCCFFFFFF); // 5% vs 80%
    Color glassBorderColor = isDark
        ? const Color(0x1AFFFFFF)
        : const Color(0x1A000000); // 10% white vs 10% black

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: bg,
      primaryColor: champagneGold,

      colorScheme: ColorScheme(
        brightness: brightness,
        primary: champagneGold,
        onPrimary: primaryDb,
        secondary: accentGold,
        onSecondary: Colors.white,
        error: const Color(0xFFFF453A),
        onError: Colors.white,
        surface: surface,
        onSurface: textColor,
        outline: glassBorderColor,
      ),

      // --- TYPOGRAPHY ---
      textTheme: TextTheme(
        displayLarge: GoogleFonts.playfairDisplay(
          fontSize: 36,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.5,
          color: textColor,
        ),
        displayMedium: GoogleFonts.playfairDisplay(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          letterSpacing: 0,
          color: champagneGold,
        ),
        headlineMedium: GoogleFonts.montserrat(
          fontSize: 20,
          fontWeight: FontWeight.w300,
          letterSpacing: 2,
          color: textColor,
        ),
        bodyLarge: GoogleFonts.montserrat(
          fontSize: 16,
          fontWeight: FontWeight.w300,
          letterSpacing: 0.5,
          color: textColor,
        ),
        bodyMedium: GoogleFonts.montserrat(
          fontSize: 14,
          fontWeight: FontWeight.w300,
          color: subTextColor,
        ),
        labelLarge: GoogleFonts.montserrat(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          letterSpacing: 1.5,
          color: champagneGold,
        ),
      ),

      // --- BUTTONS ---
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: champagneGold,
          foregroundColor: primaryDb,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          textStyle: GoogleFonts.montserrat(
            fontWeight: FontWeight.w600,
            letterSpacing: 2,
            fontSize: 14,
          ),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),

      // --- INPUTS ---
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: glassBg,
        hintStyle: GoogleFonts.montserrat(
          color: subTextColor.withValues(alpha: 0.5),
          fontSize: 13,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: glassBorderColor, width: 0.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: glassBorderColor, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: champagneGold, width: 0.5),
        ),
      ),
    );
  }
}
