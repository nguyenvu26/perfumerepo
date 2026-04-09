import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../payment/models/payment_method.dart';

class PaymentMethodSection extends StatelessWidget {
  final PaymentMethod? paymentMethod;
  final VoidCallback? onEdit;

  const PaymentMethodSection({super.key, this.paymentMethod, this.onEdit});

  @override
  Widget build(BuildContext context) {
    final hasMethod = paymentMethod != null;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PHƯƠNG THỨC THANH TOÁN',
            style: GoogleFonts.montserrat(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.6,
              color: AppTheme.mutedSilver,
            ),
          ),
          const SizedBox(height: 8),
          Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: onEdit,
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.softTaupe.withValues(alpha: 0.8),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppTheme.ivoryBackground,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        paymentMethod?.type.requiresOnlinePayment == true
                            ? Icons.credit_card_outlined
                            : Icons.payments_outlined,
                        color: hasMethod
                            ? AppTheme.deepCharcoal
                            : AppTheme.mutedSilver,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            paymentMethod?.type.displayName ??
                                'Chưa chọn phương thức',
                            style: GoogleFonts.montserrat(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: hasMethod
                                  ? AppTheme.deepCharcoal
                                  : AppTheme.mutedSilver,
                            ),
                          ),
                          if (hasMethod) ...[
                            const SizedBox(height: 3),
                            Text(
                              paymentMethod!.type.description,
                              style: GoogleFonts.montserrat(
                                fontSize: 11,
                                fontWeight: FontWeight.w400,
                                color: AppTheme.mutedSilver,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (hasMethod)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.accentGold.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          'An toàn',
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.accentGold,
                          ),
                        ),
                      ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: AppTheme.mutedSilver,
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
