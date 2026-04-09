import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/widgets/luxury_button.dart';

class ConfirmOrderSection extends StatelessWidget {
  final double subtotal;
  final double shippingCost;
  final double tax;
  final double totalAmount;
  final bool isSubmitting;
  final bool canConfirm;
  final VoidCallback? onConfirm;

  const ConfirmOrderSection({
    super.key,
    required this.subtotal,
    required this.shippingCost,
    required this.tax,
    required this.totalAmount,
    this.isSubmitting = false,
    this.canConfirm = false,
    this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepCharcoal.withValues(alpha: 0.06),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        children: [
          _PriceRow(label: 'TIỀN HÀNG', value: formatVND(subtotal)),
          const SizedBox(height: 8),
          _PriceRow(
            label: 'GIAO HÀNG',
            value: shippingCost == 0 ? 'MIỄN PHÍ' : formatVND(shippingCost),
            valueColor: shippingCost == 0 ? AppTheme.accentGold : null,
          ),
          const SizedBox(height: 8),
          _PriceRow(label: 'THUẾ', value: formatVND(tax)),
          const SizedBox(height: 12),
          Divider(
            color: AppTheme.softTaupe.withValues(alpha: 0.5),
            thickness: 0.5,
          ),
          const SizedBox(height: 12),
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
          const SizedBox(height: 20),
          LuxuryButton(
            text: 'Xác nhận đơn hàng - ${formatVND(totalAmount)}',
            onPressed: canConfirm && !isSubmitting ? onConfirm : null,
            isLoading: isSubmitting,
            height: 52,
          ),
          const SizedBox(height: 12),
          Text(
            'Bạn sẽ chỉ bị trừ tiền sau khi thanh toán được xác nhận',
            textAlign: TextAlign.center,
            style: GoogleFonts.montserrat(
              fontSize: 11,
              fontWeight: FontWeight.w400,
              color: AppTheme.mutedSilver.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.lock_outline,
                size: 13,
                color: AppTheme.mutedSilver.withValues(alpha: 0.6),
              ),
              const SizedBox(width: 6),
              Text(
                'Thanh toán bảo mật qua Stripe',
                style: GoogleFonts.montserrat(
                  fontSize: 10,
                  fontWeight: FontWeight.w400,
                  color: AppTheme.mutedSilver.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
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
            fontSize: 9,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
            color: AppTheme.mutedSilver,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.montserrat(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: valueColor ?? AppTheme.deepCharcoal,
          ),
        ),
      ],
    );
  }
}
