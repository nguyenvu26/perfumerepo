import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../models/user_profile.dart';

/// User Identity Section
///
/// Displays user avatar, name, and membership info.
///
/// Why this is a section:
/// - Centralizes user identity presentation
/// - Makes it easy to add membership badges/tiers
/// - Separates user display from profile actions
class UserIdentitySection extends StatelessWidget {
  final UserProfile profile;

  const UserIdentitySection({super.key, required this.profile});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
      child: Column(
        children: [
          // Avatar with gold ring
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.accentGold.withValues(alpha: 0.55),
                width: 2.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.accentGold.withValues(alpha: 0.15),
                  blurRadius: 18,
                  spreadRadius: 2,
                ),
                BoxShadow(
                  color: AppTheme.deepCharcoal.withValues(alpha: 0.08),
                  offset: const Offset(0, 4),
                  blurRadius: 12,
                ),
              ],
            ),
            child: ClipOval(
              child: profile.avatarUrl != null
                  ? Image.network(
                      profile.avatarUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildPlaceholder(),
                    )
                  : _buildPlaceholder(),
            ),
          ),
          const SizedBox(height: 16),
          // Name
          Text(
            profile.name,
            style: GoogleFonts.playfairDisplay(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppTheme.deepCharcoal,
              height: 1.2,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          // Email (masked)
          if (profile.email.isNotEmpty)
            Text(
              profile.email,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                fontWeight: FontWeight.w400,
                color: AppTheme.mutedSilver,
              ),
            ),
          const SizedBox(height: 12),
          // Membership badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppTheme.accentGold.withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.star_rounded, size: 12, color: AppTheme.accentGold),
                const SizedBox(width: 5),
                Text(
                  profile.memberSinceText,
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.accentGold,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: AppTheme.accentGold.withValues(alpha: 0.06),
      child: Icon(
        Icons.person_outline,
        size: 42,
        color: AppTheme.accentGold.withValues(alpha: 0.5),
      ),
    );
  }
}
