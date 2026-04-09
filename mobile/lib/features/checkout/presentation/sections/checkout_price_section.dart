import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';

class CheckoutPriceSection extends StatelessWidget {
  final double subtotal;
  final double shippingCost;
  final double tax;
  final double totalAmount;

  const CheckoutPriceSection({
    super.key,
    required this.subtotal,
    required this.shippingCost,
    required this.tax,
    required this.totalAmount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.6)),
      ),
      child: Column(
        children: [
          _PriceRow(label: 'Tiền hàng', value: formatVND(subtotal)),
          const SizedBox(height: 12),
          _PriceRow(
            label: 'Vận chuyển',
            value: shippingCost == 0 ? 'Miễn phí' : formatVND(shippingCost),
            highlight: shippingCost == 0,
          ),
          const SizedBox(height: 12),
          _PriceRow(label: 'Thuế', value: formatVND(tax)),
          const SizedBox(height: 16),
          Divider(color: AppTheme.softTaupe.withValues(alpha: 0.8), height: 1),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TỔNG CỘNG',
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.4,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              Text(
                formatVND(totalAmount),
                style: GoogleFonts.playfairDisplay(
                  fontSize: 32,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;

  const _PriceRow({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.mutedSilver,
            ),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.montserrat(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: highlight ? AppTheme.accentGold : AppTheme.deepCharcoal,
          ),
        ),
      ],
    );
  }
}
