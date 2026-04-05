import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';

/// Profile Header Section
///
/// Top bar with back button, title, and edit action.
///
/// Why this is a section:
/// - Separates header logic from profile content
/// - Makes it easy to customize header behavior per screen
/// - Reusable across other profile-related screens
class ProfileHeaderSection extends StatelessWidget {
  final VoidCallback onBack;
  final VoidCallback onEdit;

  const ProfileHeaderSection({
    super.key,
    required this.onBack,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
      color: AppTheme.ivoryBackground,
      child: Row(
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
            color: AppTheme.deepCharcoal,
            padding: const EdgeInsets.all(8),
          ),
          Expanded(
            child: Center(
              child: Text(
                'Hồ sơ của tôi',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ),
          ),
          // Edit button as a small pill
          GestureDetector(
            onTap: onEdit,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppTheme.accentGold.withValues(alpha: 0.4),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.edit_outlined,
                    size: 13,
                    color: AppTheme.accentGold,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Sửa',
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.accentGold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
