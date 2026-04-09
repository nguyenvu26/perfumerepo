import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_text_style.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_async_widget.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../models/order.dart';
import '../../providers/order_provider.dart';
import '../../providers/order_realtime_provider.dart';
import '../sections/active_orders_section.dart';
import '../sections/completed_orders_section.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(orderProvider);

    // Auto-refresh order list when any order status changes in real-time
    ref.listen<OrderStatusEvent?>(orderRealtimeProvider, (prev, next) {
      if (next != null) {
        ref.read(orderProvider.notifier).refresh();
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        title: Text(
          'Đơn hàng của tôi',
          style: AppTextStyle.displaySm(color: AppTheme.deepCharcoal),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Đang xử lý'),
            Tab(text: 'Hoàn thành'),
          ],
        ),
      ),
      body: AppAsyncWidget(
        value: orderState,
        onRetry: () => _refresh(),
        loadingBuilder: () => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 5,
          itemBuilder: (_, __) => const Padding(
            padding: EdgeInsets.only(bottom: 14),
            child: ShimmerCard(height: 148),
          ),
        ),
        dataBuilder: (state) => TabBarView(
          controller: _tabController,
          children: [
            ActiveOrdersSection(
              orders: state.active,
              onRefresh: _refresh,
              onTapOrder: _openOrderDetail,
              onTrackOrder: _openTracking,
            ),
            CompletedOrdersSection(
              orders: state.completed,
              onRefresh: _refresh,
              onTapOrder: _openOrderDetail,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _refresh() => ref.read(orderProvider.notifier).refresh();

  void _openOrderDetail(Order order) {
    context.push(AppRoutes.orderDetailWithId(order.id));
  }

  void _openTracking(Order order) {
    context.push(AppRoutes.trackOrderWithId(order.id));
  }
}
