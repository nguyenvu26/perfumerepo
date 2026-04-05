import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../models/order.dart';

class OrderStatusBadge extends StatelessWidget {
  final OrderStatus status;

  const OrderStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final style = _resolveStyle(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: style.border),
      ),
      child: Text(
        status.label.toUpperCase(),
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
          color: style.text,
          fontSize: 10,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _BadgeStyle {
  final Color background;
  final Color border;
  final Color text;

  const _BadgeStyle({
    required this.background,
    required this.border,
    required this.text,
  });
}

_BadgeStyle _resolveStyle(OrderStatus status) {
  switch (status) {
    case OrderStatus.cancelled:
      return const _BadgeStyle(
        background: Color(0x1AF43F5E),
        border: Color(0x59F43F5E),
        text: Color(0xFFB42318),
      );
    case OrderStatus.completed:
      return const _BadgeStyle(
        background: Color(0x1432D583),
        border: Color(0x4D32D583),
        text: Color(0xFF067647),
      );
    case OrderStatus.pending:
    case OrderStatus.confirmed:
    case OrderStatus.processing:
    case OrderStatus.shipped:
      return _BadgeStyle(
        background: AppTheme.accentGold.withValues(alpha: 0.14),
        border: AppTheme.accentGold.withValues(alpha: 0.42),
        text: AppTheme.deepCharcoal,
      );
  }
}
