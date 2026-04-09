import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

/// Standardized list row with optional leading widget, title, subtitle,
/// trailing widget, and divider.
///
/// ```dart
/// AppListItem(
///   leading: Icon(Icons.location_on_outlined),
///   title: 'Địa chỉ giao hàng',
///   subtitle: '123 Nguyễn Huệ, Q.1',
///   trailing: Icon(Icons.chevron_right),
///   onTap: () => ...,
/// )
/// ```
class AppListItem extends StatelessWidget {
  final Widget? leading;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool showDivider;
  final EdgeInsetsGeometry? padding;

  const AppListItem({
    super.key,
    this.leading,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.showDivider = false,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        InkWell(
          onTap: onTap,
          child: Padding(
            padding:
                padding ??
                const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              children: [
                if (leading != null) ...[leading!, const SizedBox(width: 14)],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.montserrat(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 3),
                        Text(
                          subtitle!,
                          style: GoogleFonts.montserrat(
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            color: AppTheme.mutedSilver,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) ...[const SizedBox(width: 8), trailing!],
              ],
            ),
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            color: AppTheme.softTaupe.withValues(alpha: 0.6),
            indent: 20,
            endIndent: 20,
          ),
      ],
    );
  }
}
