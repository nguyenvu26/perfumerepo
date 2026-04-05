import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../models/orders_models.dart';
import '../providers/orders_provider.dart';
import '../../pos/providers/pos_provider.dart';
import '../../staff_shell.dart';

class StaffOrdersScreen extends ConsumerStatefulWidget {
  const StaffOrdersScreen({super.key});

  @override
  ConsumerState<StaffOrdersScreen> createState() => _StaffOrdersScreenState();
}

class _StaffOrdersScreenState extends ConsumerState<StaffOrdersScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  final _currencyFmt = NumberFormat('#,###', 'vi_VN');
  final _dateFmt = DateFormat('dd/MM HH:mm');

  @override
  void initState() {
    super.initState();
    // Load on first build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(ordersProvider.notifier).loadOrders();
    });
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final query = ref.read(ordersSearchQueryProvider);
      ref
          .read(ordersProvider.notifier)
          .loadMore(search: query.isEmpty ? null : query);
    }
  }

  void _onSearch(String value) {
    ref.read(ordersSearchQueryProvider.notifier).state = value;
    ref
        .read(ordersProvider.notifier)
        .loadOrders(search: value.isEmpty ? null : value);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ordersProvider);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverToBoxAdapter(child: _buildGradientHeader(context)),
          SliverToBoxAdapter(child: _buildSearchBar()),
        ],
        body: _buildBody(state),
      ),
    );
  }

  // ── Gradient Header ────────────────────────────────────────────

  Widget _buildGradientHeader(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        MediaQuery.of(context).padding.top + AppSpacing.xs,
        AppSpacing.md,
        AppSpacing.sm,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2C2C2C), Color(0xFF1A1A1A)],
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.accentGold,
                  AppTheme.accentGold.withValues(alpha: 0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(9),
            ),
            child: const Icon(
              Icons.receipt_long_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          AppSpacing.horzSm,
          Text(
            'Đơn hàng',
            style: GoogleFonts.playfairDisplay(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const Spacer(),
          Consumer(
            builder: (ctx, ref, _) {
              final total = ref.watch(ordersProvider).total;
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold.withValues(alpha: 0.2),
                  borderRadius: AppRadius.chipBorder,
                  border: Border.all(
                    color: AppTheme.accentGold.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  '$total đơn',
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.accentGold,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ── Search Bar ─────────────────────────────────────────────────

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        0,
        AppSpacing.md,
        AppSpacing.sm,
      ),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearch,
        decoration: InputDecoration(
          hintText: 'Tìm mã đơn, SĐT, tên khách...',
          hintStyle: GoogleFonts.montserrat(
            fontSize: 13,
            color: AppTheme.mutedSilver,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: AppTheme.mutedSilver,
            size: 20,
          ),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _onSearch('');
                  },
                )
              : null,
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
          filled: true,
          fillColor: AppTheme.creamWhite,
          border: OutlineInputBorder(
            borderRadius: AppRadius.inputBorder,
            borderSide: BorderSide(color: AppTheme.softTaupe),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: AppRadius.inputBorder,
            borderSide: BorderSide(color: AppTheme.softTaupe),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: AppRadius.inputBorder,
            borderSide: const BorderSide(color: AppTheme.accentGold),
          ),
        ),
        style: GoogleFonts.montserrat(fontSize: 13),
      ),
    );
  }

  // ── Body ───────────────────────────────────────────────────────

  Widget _buildBody(OrdersState state) {
    if (state.isLoading) {
      return ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: 5,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: ShimmerCard(height: 88),
        ),
      );
    }

    if (state.error != null && state.orders.isEmpty) {
      return Center(
        child: Padding(
          padding: AppSpacing.screenAll,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: Colors.red.shade300,
              ),
              AppSpacing.vertMd,
              Text(
                'Không thể tải đơn hàng',
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  color: AppTheme.mutedSilver,
                ),
              ),
              AppSpacing.vertSm,
              TextButton(
                onPressed: () => ref.read(ordersProvider.notifier).loadOrders(),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    if (state.orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.receipt_outlined,
              size: 56,
              color: AppTheme.mutedSilver.withValues(alpha: 0.4),
            ),
            AppSpacing.vertMd,
            Text(
              'Chưa có đơn hàng nào',
              style: GoogleFonts.montserrat(
                fontSize: 14,
                color: AppTheme.mutedSilver,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppTheme.accentGold,
      onRefresh: () {
        final q = ref.read(ordersSearchQueryProvider);
        return ref
            .read(ordersProvider.notifier)
            .loadOrders(search: q.isEmpty ? null : q);
      },
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          0,
          AppSpacing.md,
          AppSpacing.md,
        ),
        itemCount: state.orders.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (ctx, i) {
          if (i == state.orders.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            );
          }
          return _buildOrderCard(state.orders[i]);
        },
      ),
    );
  }

  // ── Order Card ─────────────────────────────────────────────────

  Widget _buildOrderCard(StaffOrder order) {
    final payBadge = _paymentBadge(order.paymentStatus);

    return GestureDetector(
      onTap: () => _showDetailSheet(order.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppTheme.creamWhite,
          borderRadius: AppRadius.cardBorder,
          border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.4)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Left accent bar
            Container(
              width: 4,
              height: 80,
              decoration: BoxDecoration(
                color: payBadge.color,
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(12),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Row(
                  children: [
                    // Status icon
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: payBadge.color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        payBadge.icon,
                        size: 20,
                        color: payBadge.color,
                      ),
                    ),
                    AppSpacing.horzSm,
                    // Middle: code + customer + time
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  order.code,
                                  style: GoogleFonts.montserrat(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.deepCharcoal,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              AppSpacing.horzXs,
                              _StatusChip(
                                label: payBadge.label,
                                color: payBadge.color,
                              ),
                            ],
                          ),
                          AppSpacing.vertXxs,
                          Row(
                            children: [
                              Icon(
                                Icons.person_outline_rounded,
                                size: 12,
                                color: AppTheme.mutedSilver,
                              ),
                              const SizedBox(width: 3),
                              Flexible(
                                child: Text(
                                  order.customerDisplay,
                                  style: GoogleFonts.montserrat(
                                    fontSize: 11,
                                    color: AppTheme.mutedSilver,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.vertXxs,
                          Row(
                            children: [
                              Icon(
                                Icons.access_time_rounded,
                                size: 12,
                                color: AppTheme.mutedSilver,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                _dateFmt.format(order.createdAt.toLocal()),
                                style: GoogleFonts.montserrat(
                                  fontSize: 11,
                                  color: AppTheme.mutedSilver,
                                ),
                              ),
                              if (order.store != null) ...[
                                const SizedBox(width: 8),
                                Icon(
                                  Icons.store_outlined,
                                  size: 12,
                                  color: AppTheme.mutedSilver,
                                ),
                                const SizedBox(width: 3),
                                Flexible(
                                  child: Text(
                                    order.store!.name,
                                    style: GoogleFonts.montserrat(
                                      fontSize: 11,
                                      color: AppTheme.mutedSilver,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    AppSpacing.horzSm,
                    // Right: amount + item count
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${_currencyFmt.format(order.finalAmount)}đ',
                          style: GoogleFonts.montserrat(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.deepCharcoal,
                          ),
                        ),
                        AppSpacing.vertXxs,
                        Text(
                          '${order.items.length} SP',
                          style: GoogleFonts.montserrat(
                            fontSize: 11,
                            color: AppTheme.mutedSilver,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Detail Bottom Sheet ─────────────────────────────────────────

  void _showDetailSheet(String orderId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _OrderDetailSheet(orderId: orderId),
    );
  }

  // ── Helpers ────────────────────────────────────────────────────

  _PayBadge _paymentBadge(String status) {
    switch (status) {
      case 'PAID':
        return _PayBadge(
          label: 'Đã TT',
          color: Colors.green.shade600,
          icon: Icons.check_circle_rounded,
        );
      case 'PENDING':
        return _PayBadge(
          label: 'Chờ TT',
          color: Colors.orange.shade600,
          icon: Icons.hourglass_empty_rounded,
        );
      case 'FAILED':
        return _PayBadge(
          label: 'Đã hủy',
          color: Colors.red.shade600,
          icon: Icons.cancel_rounded,
        );
      default:
        return _PayBadge(
          label: status,
          color: AppTheme.mutedSilver,
          icon: Icons.help_outline_rounded,
        );
    }
  }
}

// ── Detail Sheet Widget ────────────────────────────────────────────

class _OrderDetailSheet extends ConsumerWidget {
  final String orderId;
  const _OrderDetailSheet({required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(orderDetailProvider(orderId));
    final currencyFmt = NumberFormat('#,###', 'vi_VN');
    final dateFmt = DateFormat('dd/MM/yyyy HH:mm');

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.ivoryBackground,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppRadius.lg),
        ),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.65,
        maxChildSize: 0.95,
        minChildSize: 0.4,
        expand: false,
        builder: (ctx, scrollCtrl) {
          return Column(
            children: [
              // Handle
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.softTaupe,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Expanded(
                child: detail.when(
                  loading: () => const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  error: (e, _) => Center(
                    child: Padding(
                      padding: AppSpacing.screenAll,
                      child: Text(
                        'Lỗi: $e',
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          color: Colors.red.shade400,
                        ),
                      ),
                    ),
                  ),
                  data: (order) => ListView(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.all(AppSpacing.md),
                    children: [
                      _buildDetailHeader(context, order, currencyFmt, dateFmt),
                      AppSpacing.vertMd,
                      if (order.user != null || order.phone != null)
                        _buildCustomerCard(order),
                      if (order.user != null || order.phone != null)
                        AppSpacing.vertMd,
                      _buildItemsList(order, currencyFmt),
                      AppSpacing.vertMd,
                      _buildOrderSummary(order, currencyFmt),
                      if (order.payments.isNotEmpty) ...[
                        AppSpacing.vertMd,
                        _buildPaymentInfo(order),
                      ],
                      if (!order.isPaid && order.status != 'CANCELLED') ...[
                        AppSpacing.vertMd,
                        _buildActionButtons(context, ref, order),
                      ],
                      AppSpacing.vertMd,
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDetailHeader(
    BuildContext context,
    StaffOrder order,
    NumberFormat currencyFmt,
    DateFormat dateFmt,
  ) {
    final isPaid = order.paymentStatus == 'PAID';
    final isCancelled = order.status == 'CANCELLED';
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                order.code,
                style: GoogleFonts.playfairDisplay(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              Text(
                dateFmt.format(order.createdAt.toLocal()),
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  color: AppTheme.mutedSilver,
                ),
              ),
              if (order.store != null)
                Text(
                  order.store!.name,
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    color: AppTheme.mutedSilver,
                  ),
                ),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${currencyFmt.format(order.finalAmount)}đ',
              style: GoogleFonts.montserrat(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.accentGold,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isCancelled
                    ? Colors.red.shade50
                    : isPaid
                    ? Colors.green.shade50
                    : Colors.orange.shade50,
                borderRadius: AppRadius.chipBorder,
              ),
              child: Text(
                isCancelled
                    ? 'Đã hủy'
                    : isPaid
                    ? 'Đã thanh toán'
                    : 'Chờ thanh toán',
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isCancelled
                      ? Colors.red.shade700
                      : isPaid
                      ? Colors.green.shade700
                      : Colors.orange.shade700,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButtons(
    BuildContext context,
    WidgetRef ref,
    StaffOrder order,
  ) {
    return Column(
      children: [
        // Retry payment row
        if (order.paymentStatus == 'PENDING')
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  // Set store for POS
                  if (order.store?.id != null) {
                    ref.read(posSelectedStoreIdProvider.notifier).state =
                        order.store!.id;
                  }
                  // Load order in POS for re-payment
                  ref
                      .read(posProvider.notifier)
                      .loadExistingOrder(order.id, storeId: order.store?.id);
                  ref.read(staffTabIndexProvider.notifier).state = 1;
                },
                icon: const Icon(Icons.replay_rounded, size: 18),
                label: const Text('Thanh toán lại'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                  shape: RoundedRectangleBorder(
                    borderRadius: AppRadius.buttonBorder,
                  ),
                ),
              ),
            ),
          ),
        // Edit + Cancel row
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  if (order.store?.id != null) {
                    ref.read(posSelectedStoreIdProvider.notifier).state =
                        order.store!.id;
                  }
                  ref
                      .read(posProvider.notifier)
                      .loadExistingOrder(order.id, storeId: order.store?.id);
                  ref.read(staffTabIndexProvider.notifier).state = 1;
                },
                icon: const Icon(Icons.edit_rounded, size: 18),
                label: const Text('Chỉnh sửa'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accentGold,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                  shape: RoundedRectangleBorder(
                    borderRadius: AppRadius.buttonBorder,
                  ),
                ),
              ),
            ),
            AppSpacing.horzSm,
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _confirmCancelOrder(context, ref, order),
                icon: const Icon(Icons.cancel_outlined, size: 18),
                label: const Text('Hủy đơn'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red.shade600,
                  side: BorderSide(color: Colors.red.shade300),
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                  shape: RoundedRectangleBorder(
                    borderRadius: AppRadius.buttonBorder,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _confirmCancelOrder(
    BuildContext context,
    WidgetRef ref,
    StaffOrder order,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: AppRadius.cardBorder),
        title: Text(
          'Xác nhận hủy đơn',
          style: GoogleFonts.playfairDisplay(
            fontWeight: FontWeight.w700,
            color: AppTheme.deepCharcoal,
          ),
        ),
        content: Text(
          'Bạn có chắc muốn hủy đơn ${order.code}? Thao tác này không thể hoàn tác.',
          style: GoogleFonts.montserrat(
            fontSize: 13,
            color: AppTheme.mutedSilver,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Không',
              style: GoogleFonts.montserrat(color: AppTheme.mutedSilver),
            ),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx); // close dialog
              final success = await ref
                  .read(posProvider.notifier)
                  .cancelOrder(order.id);
              if (context.mounted) {
                Navigator.pop(context); // close detail sheet
                // Reload orders list
                ref.read(ordersProvider.notifier).loadOrders();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success ? 'Đã hủy đơn ${order.code}' : 'Lỗi hủy đơn',
                    ),
                    backgroundColor: success
                        ? Colors.green.shade600
                        : Colors.red.shade600,
                  ),
                );
              }
            },
            child: Text(
              'Hủy đơn',
              style: GoogleFonts.montserrat(
                color: Colors.red.shade600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerCard(StaffOrder order) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: AppRadius.cardBorder,
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.12),
              borderRadius: AppRadius.cardBorder,
            ),
            child: const Icon(
              Icons.person_rounded,
              size: 18,
              color: AppTheme.accentGold,
            ),
          ),
          AppSpacing.horzSm,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.user?.fullName ?? 'Khách lẻ',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                if (order.user?.phone != null || order.phone != null)
                  Text(
                    order.user?.phone ?? order.phone!,
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                if (order.user?.email != null)
                  Text(
                    order.user!.email!,
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsList(StaffOrder order, NumberFormat currencyFmt) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: AppRadius.cardBorder,
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.md,
              AppSpacing.md,
              AppSpacing.md,
              AppSpacing.sm,
            ),
            child: Text(
              'Sản phẩm (${order.items.length})',
              style: GoogleFonts.montserrat(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.mutedSilver,
                letterSpacing: 0.5,
              ),
            ),
          ),
          ...order.items.asMap().entries.map((e) {
            final isLast = e.key == order.items.length - 1;
            return _buildItemRow(e.value, isLast, currencyFmt);
          }),
        ],
      ),
    );
  }

  Widget _buildItemRow(
    StaffOrderItem item,
    bool isLast,
    NumberFormat currencyFmt,
  ) {
    final productName = item.variant?.product?.name ?? 'Sản phẩm';
    final variantName = item.variant?.name ?? '';
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      productName,
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.deepCharcoal,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '$variantName  ×${item.quantity}',
                      style: GoogleFonts.montserrat(
                        fontSize: 11,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '${currencyFmt.format(item.totalPrice)}đ',
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ],
          ),
        ),
        if (!isLast)
          Divider(
            height: 1,
            color: AppTheme.softTaupe.withValues(alpha: 0.5),
            indent: AppSpacing.md,
            endIndent: AppSpacing.md,
          ),
      ],
    );
  }

  Widget _buildOrderSummary(StaffOrder order, NumberFormat currencyFmt) {
    final rows = <Map<String, dynamic>>[
      {'label': 'Tạm tính', 'value': order.totalAmount, 'bold': false},
      if (order.discountAmount > 0)
        {'label': 'Giảm giá', 'value': -order.discountAmount, 'bold': false},
      {'label': 'Tổng cộng', 'value': order.finalAmount, 'bold': true},
    ];

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: AppRadius.cardBorder,
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: rows.map((r) {
          final isBold = r['bold'] as bool;
          final amount = r['value'] as double;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  r['label'] as String,
                  style: GoogleFonts.montserrat(
                    fontSize: isBold ? 14 : 13,
                    fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                Text(
                  '${amount < 0 ? '-' : ''}${currencyFmt.format(amount.abs())}đ',
                  style: GoogleFonts.montserrat(
                    fontSize: isBold ? 16 : 13,
                    fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
                    color: isBold ? AppTheme.accentGold : AppTheme.deepCharcoal,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPaymentInfo(StaffOrder order) {
    final p = order.payments.first;
    final providerLabel = switch (p.provider) {
      'COD' => 'Tiền mặt',
      'PAYOS' => 'QR / Chuyển khoản',
      _ => p.provider,
    };
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: AppRadius.cardBorder,
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Icon(
            p.provider == 'COD'
                ? Icons.payments_rounded
                : Icons.qr_code_rounded,
            size: 20,
            color: AppTheme.accentGold,
          ),
          AppSpacing.horzSm,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Phương thức thanh toán',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    color: AppTheme.mutedSilver,
                  ),
                ),
                Text(
                  providerLabel,
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: p.status == 'PAID'
                  ? Colors.green.shade50
                  : Colors.orange.shade50,
              borderRadius: AppRadius.chipBorder,
            ),
            child: Text(
              p.status == 'PAID' ? 'Thành công' : p.status,
              style: GoogleFonts.montserrat(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: p.status == 'PAID'
                    ? Colors.green.shade700
                    : Colors.orange.shade700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Small helper widgets ───────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.18),
        borderRadius: AppRadius.chipBorder,
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: GoogleFonts.montserrat(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _PayBadge {
  final String label;
  final Color color;
  final IconData icon;
  const _PayBadge({
    required this.label,
    required this.color,
    required this.icon,
  });
}
