import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:perfume_gpt_app/l10n/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/currency_utils.dart';
import '../models/payment_method.dart';
import '../providers/payment_provider.dart';

class PaymentMethodScreen extends ConsumerWidget {
  final String orderId;
  final double amount;
  final String orderInfo;
  final String? shippingAddress;

  const PaymentMethodScreen({
    super.key,
    required this.orderId,
    required this.amount,
    required this.orderInfo,
    this.shippingAddress,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final paymentMethods = ref.watch(paymentMethodsProvider);
    final selectedMethod = ref.watch(selectedPaymentMethodProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text(
          l10n.selectPaymentMethod,
          style: Theme.of(
            context,
          ).textTheme.labelLarge?.copyWith(letterSpacing: 6, fontSize: 12),
        ),
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new,
            size: 18,
            color: Theme.of(context).primaryColor,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Order Summary
          Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border.all(
                color: Theme.of(context).colorScheme.outline,
                width: 0.5,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.orderNumber.toUpperCase(),
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontSize: 10),
                ),
                const SizedBox(height: 4),
                Text(
                  orderId,
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge?.copyWith(fontSize: 12),
                ),
                const SizedBox(height: 16),
                Divider(
                  color: Theme.of(context).colorScheme.outline,
                  thickness: 0.5,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      l10n.total.toUpperCase(),
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(fontSize: 12),
                    ),
                    Text(
                      formatVND(amount),
                      style: Theme.of(
                        context,
                      ).textTheme.displayMedium?.copyWith(fontSize: 24),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Payment Methods List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              itemCount: paymentMethods.length,
              itemBuilder: (context, index) {
                final method = paymentMethods[index];
                final isSelected = selectedMethod?.type == method.type;

                return _PaymentMethodCard(
                  method: method,
                  isSelected: isSelected,
                  onTap: () {
                    ref
                        .read(selectedPaymentMethodProvider.notifier)
                        .select(method);
                  },
                );
              },
            ),
          ),

          // Pay Button
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: selectedMethod == null
                      ? null
                      : () => _processPayment(context, ref, l10n),
                  child: Text(l10n.payNow),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _processPayment(
    BuildContext context,
    WidgetRef ref,
    AppLocalizations l10n,
  ) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(
                color: AppTheme.champagneGold,
                strokeWidth: 2,
              ),
              const SizedBox(height: 24),
              Text(
                l10n.processingPayment,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
      ),
    );

    try {
      final result = await ref
          .read(paymentActionsProvider)
          .processPayment(
            orderId: orderId,
            amount: amount,
            orderInfo: orderInfo,
            shippingAddress: shippingAddress,
          );

      if (!context.mounted) return;
      Navigator.pop(context); // Close loading

      if (result.success) {
        if (result.paymentUrl != null) {
          // TODO: Open payment URL in webview or external browser
          // For now, show success
          context.push(
            '/payment/result',
            extra: {
              'success': true,
              'message': result.message,
              'orderId': orderId,
            },
          );
        } else {
          // COD success
          context.push(
            '/payment/result',
            extra: {
              'success': true,
              'message': result.message,
              'orderId': orderId,
            },
          );
        }
      } else {
        // Show error
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(result.message)));
      }
    } catch (e) {
      if (!context.mounted) return;
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${l10n.paymentFailed}: $e')));
    }
  }
}

class _PaymentMethodCard extends StatelessWidget {
  final PaymentMethod method;
  final bool isSelected;
  final VoidCallback onTap;

  const _PaymentMethodCard({
    required this.method,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border.all(
          color: isSelected
              ? AppTheme.champagneGold
              : Theme.of(context).colorScheme.outline,
          width: isSelected ? 1.5 : 0.5,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: method.isEnabled ? onTap : null,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                // Icon/Logo
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Theme.of(context).colorScheme.outline,
                      width: 0.5,
                    ),
                  ),
                  child: Center(child: _getPaymentIcon(method.type)),
                ),
                const SizedBox(width: 16),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getPaymentName(l10n, method.type),
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _getPaymentDescription(l10n, method.type),
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(fontSize: 11),
                      ),
                    ],
                  ),
                ),

                // Selection Indicator
                if (isSelected)
                  Container(
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(
                      color: AppTheme.champagneGold,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check,
                      size: 16,
                      color: AppTheme.primaryDb,
                    ),
                  )
                else
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Theme.of(context).colorScheme.outline,
                        width: 1.5,
                      ),
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _getPaymentIcon(PaymentMethodType type) {
    IconData icon;
    Color color;

    switch (type) {
      case PaymentMethodType.vnpay:
        icon = Icons.account_balance_wallet;
        color = const Color(0xFF0066CC);
        break;
      case PaymentMethodType.momo:
        icon = Icons.account_balance_wallet;
        color = const Color(0xFFD82D8B);
        break;
      case PaymentMethodType.cod:
        icon = Icons.local_shipping_outlined;
        color = AppTheme.accentGold;
        break;
      case PaymentMethodType.payos:
        icon = Icons.qr_code_2_rounded;
        color = const Color(0xFF0A68FF);
        break;
    }

    return Icon(icon, color: color, size: 24);
  }

  String _getPaymentName(AppLocalizations l10n, PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.vnpay:
        return l10n.vnpay;
      case PaymentMethodType.momo:
        return l10n.momo;
      case PaymentMethodType.cod:
        return l10n.cod;
      case PaymentMethodType.payos:
        return 'PayOS';
    }
  }

  String _getPaymentDescription(AppLocalizations l10n, PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.vnpay:
        return 'Thanh toán bằng ví điện tử VNPay';
      case PaymentMethodType.momo:
        return 'Thanh toán bằng ví điện tử MoMo';
      case PaymentMethodType.cod:
        return 'Thanh toán khi nhận hàng';
      case PaymentMethodType.payos:
        return 'Quét mã QR hoặc chuyển khoản ngân hàng';
    }
  }
}
