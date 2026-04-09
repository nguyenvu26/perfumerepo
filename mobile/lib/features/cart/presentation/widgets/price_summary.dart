import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';

class PriceSummary extends StatelessWidget {
  final double subtotal;
  final double discount;
  final double total;
  final double shipping;

  const PriceSummary({
    super.key,
    required this.subtotal,
    required this.discount,
    required this.total,
    this.shipping = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'CHI TIẾT ĐọN HÀNG',
            style: GoogleFonts.montserrat(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
              color: AppTheme.mutedSilver,
            ),
          ),
          const SizedBox(height: 14),
          _PriceRow(label: 'Tạm tính', value: formatVND(subtotal)),
          if (discount > 0) ...[
            const SizedBox(height: 8),
            _PriceRow(
              label: 'Giảm giá',
              value: '-${formatVND(discount)}',
              valueColor: const Color(0xFF27AE60),
            ),
          ],
          const SizedBox(height: 8),
          _PriceRow(
            label: 'Phí vận chuyển',
            value: shipping == 0 ? 'Miễn phí' : formatVND(shipping),
            valueColor: shipping == 0 ? const Color(0xFF27AE60) : null,
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFEEE9E2)),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                'TỔNG CỘNG',
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                  letterSpacing: 0.5,
                ),
              ),
              Text(
                formatVND(total),
                style: GoogleFonts.playfairDisplay(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
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
  final Color? valueColor;

  const _PriceRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.montserrat(
            fontSize: 13,
            color: AppTheme.deepCharcoal.withValues(alpha: 0.65),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.montserrat(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: valueColor ?? AppTheme.deepCharcoal,
          ),
        ),
      ],
    );
  }
}
