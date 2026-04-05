import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_text_style.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../models/order.dart';
import '../../providers/order_provider.dart';
import '../../providers/order_realtime_provider.dart';
import '../widgets/order_status_badge.dart';

class OrderDetailScreen extends ConsumerWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<OrderStatusEvent?>(orderRealtimeProvider, (prev, next) {
      if (next != null && next.orderId == orderId) {
        ref.invalidate(orderDetailProvider(orderId));
        ref.invalidate(orderPaymentProvider(orderId));
      }
    });

    final orderAsync = ref.watch(orderDetailProvider(orderId));
    final paymentAsync = ref.watch(orderPaymentProvider(orderId));

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: orderAsync.when(
        data: (order) => RefreshIndicator(
          color: AppTheme.accentGold,
          onRefresh: () async {
            ref.invalidate(orderDetailProvider(orderId));
            ref.invalidate(orderPaymentProvider(orderId));
          },
          child: CustomScrollView(
            slivers: [
              // ── Gradient AppBar with order info ──
              SliverAppBar(
                expandedHeight: 140,
                pinned: true,
                backgroundColor: AppTheme.ivoryBackground,
                surfaceTintColor: Colors.transparent,
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 16,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFFF8F2EB), Color(0xFFEDE3D8)],
                      ),
                    ),
                    child: SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(56, 12, 20, 0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Chi tiết đơn hàng',
                              style: GoogleFonts.playfairDisplay(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.deepCharcoal,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(
                                  Icons.receipt_long_rounded,
                                  size: 14,
                                  color: AppTheme.mutedSilver,
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  order.code,
                                  style: GoogleFonts.montserrat(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.mutedSilver,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                OrderStatusBadge(status: order.status),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Đặt ngày ${_formatDateTime(order.createdAt)}',
                              style: GoogleFonts.montserrat(
                                fontSize: 11.5,
                                color: AppTheme.mutedSilver,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // ── Body ──
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _ProductList(order: order),
                    const SizedBox(height: 14),
                    _PriceBreakdown(order: order),
                    const SizedBox(height: 14),
                    _ShippingAddress(order: order),
                    const SizedBox(height: 14),
                    paymentAsync.when(
                      data: (payment) => _PaymentInfo(
                        paymentLabel: _paymentLabel(
                          order,
                          payment?.status.name.toUpperCase(),
                        ),
                      ),
                      loading: () =>
                          const _PaymentInfo(paymentLabel: 'Đang kiểm tra...'),
                      error: (_, __) =>
                          const _PaymentInfo(paymentLabel: 'Không khả dụng'),
                    ),
                    const SizedBox(height: 24),

                    // ── Action buttons ──
                    if (order.canTrack) ...[
                      _GoldButton(
                        icon: Icons.location_on_rounded,
                        label: 'Theo dõi đơn hàng',
                        onPressed: () =>
                            context.push(AppRoutes.trackOrderWithId(order.id)),
                      ),
                      const SizedBox(height: 10),
                    ],
                    _OutlineButton(
                      icon: Icons.headset_mic_rounded,
                      label: 'Liên hệ hỗ trợ',
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Bộ phận hỗ trợ sẽ liên hệ bạn sớm nhất.',
                              style: GoogleFonts.montserrat(fontSize: 13),
                            ),
                            backgroundColor: AppTheme.deepCharcoal,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        );
                      },
                    ),
                  ]),
                ),
              ),
            ],
          ),
        ),
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.accentGold),
        ),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  size: 48,
                  color: AppTheme.mutedSilver,
                ),
                const SizedBox(height: 12),
                Text(
                  error.toString(),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION CARD WRAPPER
// ═══════════════════════════════════════════════════════════════════════════
class _SectionCard extends StatelessWidget {
  final Widget child;
  const _SectionCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepCharcoal.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: child,
    );
  }
}

Widget _sectionHeader(String title, IconData icon) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: AppTheme.accentGold.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 16, color: AppTheme.accentGold),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: GoogleFonts.playfairDisplay(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.deepCharcoal,
          ),
        ),
      ],
    ),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT LIST
// ═══════════════════════════════════════════════════════════════════════════
class _ProductList extends StatelessWidget {
  final Order order;
  const _ProductList({required this.order});

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Sản phẩm', Icons.shopping_bag_rounded),
          ...order.items.asMap().entries.map((entry) {
            final item = entry.value;
            final isLast = entry.key == order.items.length - 1;

            return Column(
              children: [
                GestureDetector(
                  onTap: item.productId.isNotEmpty
                      ? () => context.push(
                          AppRoutes.productDetailWithId(item.productId),
                        )
                      : null,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Product image
                      Container(
                        width: 68,
                        height: 68,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          color: const Color(0xFFF8F5F0),
                          border: Border.all(
                            color: AppTheme.accentGold.withValues(alpha: 0.2),
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: item.productImage.isNotEmpty
                              ? Image.network(
                                  item.productImage,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      _productPlaceholder(),
                                )
                              : _productPlaceholder(),
                        ),
                      ),
                      const SizedBox(width: 14),
                      // Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.productName,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppTextStyle.titleMd(
                                color: AppTheme.deepCharcoal,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'x${item.quantity}${item.variantLabel.isEmpty ? '' : '  •  ${item.variantLabel}'}',
                              style: GoogleFonts.montserrat(
                                fontSize: 12,
                                color: AppTheme.mutedSilver,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        formatVND(item.totalPrice),
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                    ],
                  ),
                ),
                if (!isLast)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Divider(
                      height: 1,
                      color: AppTheme.softTaupe.withValues(alpha: 0.6),
                    ),
                  ),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _productPlaceholder() {
    return const Center(
      child: Icon(
        Icons.inventory_2_outlined,
        size: 24,
        color: AppTheme.softTaupe,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICE BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════
class _PriceBreakdown extends StatelessWidget {
  final Order order;
  const _PriceBreakdown({required this.order});

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      child: Column(
        children: [
          _sectionHeader('Thanh toán', Icons.receipt_rounded),
          _priceLine(context, 'Tạm tính', formatVND(order.totalAmount)),
          const SizedBox(height: 8),
          _priceLine(
            context,
            'Giảm giá',
            '-${formatVND(order.discountAmount)}',
            isDiscount: true,
          ),
          const SizedBox(height: 8),
          _priceLine(context, 'Phí giao hàng', formatVND(order.shippingFee)),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    AppTheme.softTaupe,
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Row(
            children: [
              Text(
                'Tổng cộng',
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              const Spacer(),
              Text(
                formatVND(order.finalAmount),
                style: GoogleFonts.playfairDisplay(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.accentGold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _priceLine(
    BuildContext context,
    String label,
    String value, {
    bool isDiscount = false,
  }) {
    return Row(
      children: [
        Text(
          label,
          style: GoogleFonts.montserrat(
            fontSize: 13,
            color: AppTheme.mutedSilver,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: GoogleFonts.montserrat(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isDiscount ? const Color(0xFF12B76A) : AppTheme.deepCharcoal,
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHIPPING ADDRESS
// ═══════════════════════════════════════════════════════════════════════════
class _ShippingAddress extends StatelessWidget {
  final Order order;
  const _ShippingAddress({required this.order});

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Địa chỉ giao hàng', Icons.location_on_rounded),
          Row(
            children: [
              const Icon(
                Icons.person_outline_rounded,
                size: 16,
                color: AppTheme.mutedSilver,
              ),
              const SizedBox(width: 8),
              Text(
                order.recipientName,
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(
                Icons.phone_outlined,
                size: 16,
                color: AppTheme.mutedSilver,
              ),
              const SizedBox(width: 8),
              Text(
                order.phone,
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  color: AppTheme.mutedSilver,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(
                  Icons.place_outlined,
                  size: 16,
                  color: AppTheme.mutedSilver,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  order.shippingAddress,
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    height: 1.5,
                    color: const Color(0xFF6B6B6B),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT INFO
// ═══════════════════════════════════════════════════════════════════════════
class _PaymentInfo extends StatelessWidget {
  final String paymentLabel;
  const _PaymentInfo({required this.paymentLabel});

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.credit_card_rounded,
              size: 16,
              color: AppTheme.accentGold,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            'Thanh toán',
            style: GoogleFonts.playfairDisplay(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFF0F6EC),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              paymentLabel,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF067647),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BUTTONS
// ═══════════════════════════════════════════════════════════════════════════
class _GoldButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  const _GoldButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFD4AF37), Color(0xFFE2C563)],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppTheme.accentGold.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 15),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 18, color: Colors.white),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OutlineButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  const _OutlineButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        side: const BorderSide(color: AppTheme.softTaupe, width: 1.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18, color: AppTheme.deepCharcoal),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
          ),
        ],
      ),
    );
  }
}

String _paymentLabel(Order order, String? paymentStatus) {
  if (paymentStatus != null && paymentStatus.isNotEmpty) {
    return paymentStatus;
  }
  return order.paymentStatus.name.toUpperCase();
}

String _formatDateTime(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');
  return '$day/$month/${date.year} $hour:$minute';
}
