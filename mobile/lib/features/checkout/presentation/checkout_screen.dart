import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/routing/app_routes.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/currency_utils.dart';
import '../../../core/widgets/luxury_button.dart';
import '../../address/providers/address_providers.dart';
import '../../orders/providers/order_provider.dart';
import '../providers/checkout_provider.dart';
import 'sections/checkout_address_section.dart';
import 'sections/checkout_items_section.dart';
import 'sections/checkout_payment_section.dart';
import 'sections/checkout_price_section.dart';

class CheckoutScreen extends ConsumerWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(addressListProvider);
    final checkoutState = ref.watch(checkoutProvider);
    final itemCount = checkoutState.orderItems.fold<int>(
      0,
      (sum, item) => sum + item.quantity,
    );

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        backgroundColor: AppTheme.ivoryBackground,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'THANH TOÁN',
          style: GoogleFonts.montserrat(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 2.4,
            color: AppTheme.deepCharcoal,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.deepCharcoal),
          onPressed: () => context.pop(),
        ),
      ),
      body: checkoutState.orderItems.isEmpty
          ? checkoutState.isCartLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppTheme.accentGold,
                    ),
                  )
                : _EmptyCheckoutState(
                    onReturnToCart: () => context.go(AppRoutes.cart),
                    message:
                        checkoutState.cartError ??
                        'Hãy thêm sản phẩm vào giỏ hàng trước khi tiến hành thanh toán.',
                  )
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 140),
              children: [
                _CompactOrderHeader(
                  itemCount: itemCount,
                  totalAmount: checkoutState.totalAmount,
                ),
                const SizedBox(height: 20),
                const _SectionLabel(label: 'ĐỊA CHỈ GIAO HÀNG'),
                const SizedBox(height: 8),
                CheckoutAddressSection(
                  address: checkoutState.selectedAddress,
                  onTap: () => _showAddressSheet(context, ref),
                  highlight: checkoutState.selectedAddress == null,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Expanded(
                      child: _SectionLabel(label: 'PHƯƠNG THỨC THANH TOÁN'),
                    ),
                    TextButton(
                      onPressed: () =>
                          context.push(AppRoutes.profilePaymentMethods),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        'Đổi',
                        style: GoogleFonts.montserrat(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.accentGold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                CheckoutPaymentSection(
                  method: checkoutState.selectedPaymentMethod,
                  onEdit: () => context.push(AppRoutes.profilePaymentMethods),
                ),
                const SizedBox(height: 16),
                const _SectionLabel(label: 'SẢN PHẨM'),
                const SizedBox(height: 8),
                CheckoutItemsSection(items: checkoutState.orderItems),
                const SizedBox(height: 16),
                const _SectionLabel(label: 'TỔNG CỘNG'),
                const SizedBox(height: 8),
                CheckoutPriceSection(
                  subtotal: checkoutState.subtotal,
                  shippingCost: checkoutState.shippingCost,
                  tax: checkoutState.tax,
                  totalAmount: checkoutState.totalAmount,
                ),
              ],
            ),
      bottomNavigationBar: checkoutState.orderItems.isEmpty
          ? null
          : _CheckoutBottomBar(
              totalAmount: checkoutState.totalAmount,
              isSubmitting: checkoutState.isSubmitting,
              canConfirm: checkoutState.canConfirm,
              pendingPayment: checkoutState.pendingOnlinePayment,
              onConfirm: () => _handleConfirmOrder(context, ref),
            ),
    );
  }

  Future<void> _showAddressSheet(BuildContext context, WidgetRef ref) async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return AddressPickerSheet(
          onSelected: () => Navigator.of(sheetContext).pop(),
        );
      },
    );
  }

  Future<void> _handleConfirmOrder(BuildContext context, WidgetRef ref) async {
    final notifier = ref.read(checkoutProvider.notifier);
    final currentState = ref.read(checkoutProvider);
    final isOnlinePayment =
        currentState.selectedPaymentMethod?.type.requiresOnlinePayment ?? false;

    // For existing online orders, verify backend status before any success navigation.
    if (isOnlinePayment && currentState.createdOrderId != null) {
      final isPaid = await notifier.isOnlinePaymentPaid();
      if (!context.mounted) return;

      if (isPaid) {
        ref.invalidate(orderProvider);
        context.go(AppRoutes.orderSuccess);
        return;
      }
    }

    final success = await notifier.confirmOrder();
    if (!context.mounted) return;

    if (!success) {
      final errorMessage = ref.read(checkoutProvider).errorMessage;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage ?? 'Không thể xác nhận đơn hàng'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final checkoutState = ref.read(checkoutProvider);
    final payosUrl = checkoutState.payosCheckoutUrl;
    final isOnlineAfterConfirm =
        checkoutState.selectedPaymentMethod?.type.requiresOnlinePayment ??
        false;

    if (isOnlineAfterConfirm) {
      if (payosUrl == null || payosUrl.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đơn đã tạo nhưng chưa có link thanh toán. Thử lại.'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }

      try {
        final launched = await launchUrl(
          Uri.parse(payosUrl),
          mode: LaunchMode.externalApplication,
        );

        if (!context.mounted) return;

        if (!launched) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Không thể mở trang thanh toán. Nhấn nút để thử lại.',
              ),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 4),
            ),
          );
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Hoàn tất thanh toán trên browser, sau đó quay lại và nhấn kiểm tra.',
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      } catch (_) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Không thể mở trang thanh toán. Nhấn nút để thử lại.',
            ),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 4),
          ),
        );
      }
      return;
    }

    // COD  navigate directly to success
    ref.invalidate(orderProvider);
    context.go(AppRoutes.orderSuccess);
  }
}

//  Small private helpers kept in orchestrator

class _CompactOrderHeader extends StatelessWidget {
  final int itemCount;
  final double totalAmount;

  const _CompactOrderHeader({
    required this.itemCount,
    required this.totalAmount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppTheme.champagneGold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.shopping_bag_outlined,
              color: AppTheme.accentGold,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$itemCount sản phẩm',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Dự kiến nhận hàng trong 24 ngày',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          ),
          Text(
            formatVND(totalAmount),
            style: GoogleFonts.playfairDisplay(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.deepCharcoal,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: GoogleFonts.montserrat(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.6,
        color: AppTheme.mutedSilver,
      ),
    );
  }
}

class _CheckoutBottomBar extends StatelessWidget {
  final double totalAmount;
  final bool isSubmitting;
  final bool canConfirm;
  final bool pendingPayment;
  final VoidCallback onConfirm;

  const _CheckoutBottomBar({
    required this.totalAmount,
    required this.isSubmitting,
    required this.canConfirm,
    required this.pendingPayment,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final buttonText = pendingPayment
        ? 'Kiểm tra / mở lại thanh toán  '
        : 'Đặt hàng    ${formatVND(totalAmount)}';
    final buttonIcon = pendingPayment
        ? Icons.open_in_browser_rounded
        : Icons.arrow_forward_rounded;
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: AppTheme.softTaupe.withValues(alpha: 0.6)),
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.deepCharcoal.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            LuxuryButton(
              text: buttonText,
              trailingIcon: buttonIcon,
              height: 56,
              isLoading: isSubmitting,
              onPressed: canConfirm && !isSubmitting ? onConfirm : null,
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                _TrustItem(icon: Icons.lock_outline_rounded, label: 'Bảo mật'),
                _TrustDivider(),
                _TrustItem(
                  icon: Icons.local_shipping_outlined,
                  label: '24 ngày',
                ),
                _TrustDivider(),
                _TrustItem(
                  icon: Icons.replay_rounded,
                  label: 'Đổi trả 14 ngày',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final String label;

  const _TrustItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 12,
          color: AppTheme.mutedSilver.withValues(alpha: 0.7),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: GoogleFonts.montserrat(
            fontSize: 10,
            fontWeight: FontWeight.w500,
            color: AppTheme.mutedSilver.withValues(alpha: 0.8),
          ),
        ),
      ],
    );
  }
}

class _TrustDivider extends StatelessWidget {
  const _TrustDivider();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Text(
        '',
        style: TextStyle(fontSize: 12, color: AppTheme.softTaupe),
      ),
    );
  }
}

class _EmptyCheckoutState extends StatelessWidget {
  final VoidCallback onReturnToCart;
  final String message;

  const _EmptyCheckoutState({
    required this.onReturnToCart,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
              ),
              child: const Icon(
                Icons.shopping_bag_outlined,
                size: 34,
                color: AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Trang thanh toán của bạn đang trống.',
              style: GoogleFonts.playfairDisplay(
                fontSize: 28,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(
                fontSize: 13,
                height: 1.6,
                fontWeight: FontWeight.w500,
                color: AppTheme.mutedSilver,
              ),
            ),
            const SizedBox(height: 24),
            LuxuryButton(text: 'Quay lại giỏ hàng', onPressed: onReturnToCart),
          ],
        ),
      ),
    );
  }
}
