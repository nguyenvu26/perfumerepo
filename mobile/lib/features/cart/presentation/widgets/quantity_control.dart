import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../models/cart_item.dart';
import '../../providers/cart_provider.dart';

class QuantityControl extends ConsumerWidget {
  final CartItem item;

  const QuantityControl({super.key, required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      height: 38,
      decoration: BoxDecoration(
        color: AppTheme.ivoryBackground,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _QtyBtn(
            icon: Icons.remove,
            enabled: item.quantity > 1,
            onTap: () => ref
                .read(cartProvider.notifier)
                .updateQuantity(item.id, item.quantity - 1),
          ),
          SizedBox(
            width: 38,
            child: Center(
              child: Text(
                '${item.quantity}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ),
          ),
          _QtyBtn(
            icon: Icons.add,
            enabled: true,
            onTap: () => ref
                .read(cartProvider.notifier)
                .updateQuantity(item.id, item.quantity + 1),
          ),
        ],
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  const _QtyBtn({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(19),
      child: SizedBox(
        width: 38,
        height: 38,
        child: Icon(
          icon,
          size: 16,
          color: enabled ? AppTheme.deepCharcoal : AppTheme.mutedSilver,
        ),
      ),
    );
  }
}
