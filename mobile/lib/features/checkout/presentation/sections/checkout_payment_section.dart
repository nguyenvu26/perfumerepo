import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../payment/models/payment_method.dart';

class CheckoutPaymentSection extends StatelessWidget {
  final PaymentMethod? method;
  final VoidCallback onEdit;

  const CheckoutPaymentSection({
    super.key,
    required this.method,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final m = method;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onEdit,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.accentGold, width: 1.4),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.accentGold.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  m != null ? paymentIcon(m.type) : Icons.payment_outlined,
                  color: AppTheme.accentGold,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  m?.label ?? 'Chưa chọn',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
              ),
              const Icon(
                Icons.radio_button_checked,
                color: AppTheme.accentGold,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

IconData paymentIcon(PaymentMethodType type) {
  switch (type) {
    case PaymentMethodType.cod:
      return Icons.local_shipping_outlined;
    case PaymentMethodType.payos:
      return Icons.qr_code_2_rounded;
    case PaymentMethodType.vnpay:
      return Icons.account_balance_wallet_outlined;
    case PaymentMethodType.momo:
      return Icons.phone_iphone_outlined;
  }
}
