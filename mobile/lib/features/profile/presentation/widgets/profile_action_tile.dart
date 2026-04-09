import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';

/// Profile Action Tile
///
/// Reusable navigation list item for profile actions.
/// Used for: My Orders, Shipping Addresses, Payment Methods, AI Preferences.
///
/// Why this widget exists:
/// - Eliminates code duplication across profile items
/// - Ensures consistent spacing and styling
/// - Makes adding new profile actions trivial
class ProfileActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final bool subtitleIsBadge;

  const ProfileActionTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
    this.subtitleIsBadge = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(
              bottom: BorderSide(
                color: AppTheme.softTaupe.withValues(alpha: 0.2),
                width: 0.5,
              ),
            ),
          ),
          child: Row(
            children: [
              // Icon box
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.ivoryBackground,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppTheme.deepCharcoal, size: 19),
              ),
              const SizedBox(width: 14),
              // Title
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
              ),
              // Trailing: badge pill or chevron
              if (subtitle != null && subtitleIsBadge)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    subtitle!,
                    style: GoogleFonts.montserrat(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.accentGold,
                    ),
                  ),
                )
              else if (subtitle != null)
                Text(
                  subtitle!,
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              const SizedBox(width: 6),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 11,
                color: AppTheme.mutedSilver.withValues(alpha: 0.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
