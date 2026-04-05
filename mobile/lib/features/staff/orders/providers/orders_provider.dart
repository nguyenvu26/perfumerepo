import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_client.dart';
import '../models/orders_models.dart';
import '../services/orders_service.dart';

// ── Service ─────────────────────────────────────────────────────────

final staffOrdersServiceProvider = Provider<StaffOrdersService>((ref) {
  final client = ref.watch(apiClientProvider);
  return StaffOrdersService(client: client);
});

// ── Search Query ─────────────────────────────────────────────────────

final ordersSearchQueryProvider = StateProvider<String>((ref) => '');

// ── Orders List State ─────────────────────────────────────────────────

class OrdersState {
  final List<StaffOrder> orders;
  final int total;
  final int pages;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentSkip;

  const OrdersState({
    this.orders = const [],
    this.total = 0,
    this.pages = 0,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentSkip = 0,
  });

  bool get hasMore => orders.length < total;

  OrdersState copyWith({
    List<StaffOrder>? orders,
    int? total,
    int? pages,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentSkip,
    bool clearError = false,
  }) {
    return OrdersState(
      orders: orders ?? this.orders,
      total: total ?? this.total,
      pages: pages ?? this.pages,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      currentSkip: currentSkip ?? this.currentSkip,
    );
  }
}

class OrdersNotifier extends StateNotifier<OrdersState> {
  final StaffOrdersService _service;

  OrdersNotifier(this._service) : super(const OrdersState());

  Future<void> loadOrders({String? search}) async {
    state = const OrdersState(isLoading: true);
    try {
      final page = await _service.listOrders(skip: 0, search: search);
      state = OrdersState(
        orders: page.data,
        total: page.total,
        pages: page.pages,
        currentSkip: page.data.length,
      );
    } catch (e) {
      state = OrdersState(error: e.toString());
    }
  }

  Future<void> loadMore({String? search}) async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true, clearError: true);
    try {
      final page = await _service.listOrders(
        skip: state.currentSkip,
        search: search,
      );
      state = state.copyWith(
        orders: [...state.orders, ...page.data],
        total: page.total,
        pages: page.pages,
        isLoadingMore: false,
        currentSkip: state.currentSkip + page.data.length,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: e.toString());
    }
  }
}

final ordersProvider = StateNotifierProvider<OrdersNotifier, OrdersState>((
  ref,
) {
  final service = ref.watch(staffOrdersServiceProvider);
  return OrdersNotifier(service);
});

// ── Order Detail ──────────────────────────────────────────────────────

final orderDetailProvider = FutureProvider.family<StaffOrder, String>((
  ref,
  id,
) async {
  final service = ref.watch(staffOrdersServiceProvider);
  return service.getOrderDetail(id);
});
