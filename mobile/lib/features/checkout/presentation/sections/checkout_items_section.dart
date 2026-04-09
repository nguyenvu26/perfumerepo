import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../cart/models/cart_item.dart';

class CheckoutItemsSection extends StatelessWidget {
  final List<CartItem> items;

  const CheckoutItemsSection({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.6)),
      ),
      child: Column(
        children: [
          for (var index = 0; index < items.length; index++) ...[
            _OrderItemRow(item: items[index]),
            if (index != items.length - 1)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Divider(
                  color: AppTheme.softTaupe.withValues(alpha: 0.8),
                  height: 1,
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _OrderItemRow extends StatelessWidget {
  final CartItem item;

  const _OrderItemRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 60,
          height: 72,
          decoration: BoxDecoration(
            color: AppTheme.ivoryBackground,
            borderRadius: BorderRadius.circular(12),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              item.productImage,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.image_outlined,
                size: 28,
                color: AppTheme.mutedSilver,
              ),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.productName,
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if ((item.variant ?? '').isNotEmpty)
                    _TagChip(label: item.variant!),
                  if ((item.size ?? '').isNotEmpty && item.size != item.variant)
                    _TagChip(label: item.size!),
                  _TagChip(label: 'SL ${item.quantity}'),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                formatVND(item.subtotal),
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TagChip extends StatelessWidget {
  final String label;

  const _TagChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.ivoryBackground,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: GoogleFonts.montserrat(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppTheme.deepCharcoal,
        ),
      ),
    );
  }
}
