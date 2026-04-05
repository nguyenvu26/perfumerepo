import 'package:flutter/material.dart';
import '../theme/app_radius.dart';
import '../theme/app_shadows.dart';
import '../theme/app_theme.dart';

/// Standardized surface card using design-system shadow and radius.
///
/// ```dart
/// AppCard(
///   child: Text('content'),
/// )
/// ```
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? color;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? shadows;
  final VoidCallback? onTap;
  final Border? border;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.color,
    this.borderRadius,
    this.shadows,
    this.onTap,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? AppRadius.cardBorder;
    final bg = color ?? AppTheme.creamWhite;

    final card = Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: radius,
        boxShadow: shadows ?? AppShadows.card,
        border: border,
      ),
      child: child,
    );

    if (onTap == null) return card;

    return Material(
      color: bg,
      borderRadius: radius,
      child: InkWell(borderRadius: radius, onTap: onTap, child: card),
    );
  }
}
