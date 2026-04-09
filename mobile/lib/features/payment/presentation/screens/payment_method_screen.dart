import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../models/payment_method.dart';
import '../../providers/payment_method_provider.dart';
import '../widgets/payment_method_tile.dart';

class PreferredPaymentMethodScreen extends ConsumerWidget {
  const PreferredPaymentMethodScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final methods = ref.watch(paymentMethodsProvider);
    final selectedMethod = ref.watch(selectedPaymentMethodProvider);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── Header ──
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 18,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Phương thức thanh toán',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Body ──
            Expanded(
              child: methods.isEmpty
                  ? Center(
                      child: Text(
                        'Chưa có phương thức thanh toán khả dụng.',
                        style: GoogleFonts.montserrat(
                          fontSize: 14,
                          color: AppTheme.mutedSilver,
                        ),
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                      children: [
                        // Subtitle
                        Padding(
                          padding: const EdgeInsets.only(bottom: 18),
                          child: Text(
                            'Chọn phương thức mặc định cho đơn hàng tiếp theo',
                            style: GoogleFonts.montserrat(
                              fontSize: 13,
                              fontWeight: FontWeight.w400,
                              height: 1.5,
                              color: AppTheme.mutedSilver,
                            ),
                          ),
                        ),

                        // Payment cards
                        for (final method in methods)
                          PaymentMethodTile(
                            title: method.label,
                            description: method.description,
                            type: method.type,
                            isSelected: selectedMethod?.id == method.id,
                            badgeLabel: _badgeFor(method.type),
                            onTap: () => _onSelectMethod(context, ref, method),
                          ),

                        // Info note
                        const SizedBox(height: 8),
                        _InfoNote(),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  String? _badgeFor(PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.payos:
        return 'Đề xuất';
      case PaymentMethodType.cod:
        return 'Dự phòng';
      default:
        return null;
    }
  }

  void _onSelectMethod(
    BuildContext context,
    WidgetRef ref,
    PaymentMethod method,
  ) {
    ref.read(updatePaymentMethodProvider).setDefault(method);
    // Pop back to wherever the user came from (checkout or profile).
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }
}

class _InfoNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1E7DA),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            size: 18,
            color: AppTheme.accentGold,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'PayOS cho phép quét QR hoặc chuyển khoản tức thì. '
              'COD phù hợp khi bạn muốn kiểm tra hàng trước khi thanh toán.',
              style: GoogleFonts.montserrat(
                fontSize: 11,
                height: 1.55,
                fontWeight: FontWeight.w500,
                color: AppTheme.deepCharcoal.withValues(alpha: 0.65),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
