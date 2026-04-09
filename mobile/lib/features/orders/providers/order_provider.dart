import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../models/order.dart';
import '../models/payment.dart';
import '../services/order_service.dart';
import '../services/payment_service.dart';

class OrderListState {
  final List<Order> all;
  final List<Order> active;
  final List<Order> completed;

  const OrderListState({
    required this.all,
    required this.active,
    required this.completed,
  });

  factory OrderListState.fromOrders(List<Order> orders) {
    final active = orders.where((order) => order.status.isActive).toList();
    final completed = orders.where((order) => order.isCompletedBucket).toList();
    return OrderListState(all: orders, active: active, completed: completed);
  }
}

class TrackingTimelineStep {
  final String title;
  final String description;
  final DateTime? timestamp;
  final bool reached;
  final bool current;

  const TrackingTimelineStep({
    required this.title,
    required this.description,
    required this.timestamp,
    required this.reached,
    required this.current,
  });
}

class TrackingViewData {
  final String header;
  final String etaText;
  final String mapLabel;
  final List<TrackingTimelineStep> steps;

  const TrackingViewData({
    required this.header,
    required this.etaText,
    required this.mapLabel,
    required this.steps,
  });
}

final orderServiceProvider = Provider<OrderService>((ref) {
  final client = ref.watch(apiClientProvider);
  return OrderService(client: client);
});

final orderPaymentServiceProvider = Provider<OrderPaymentService>((ref) {
  final client = ref.watch(apiClientProvider);
  return OrderPaymentService(client: client);
});

class OrderNotifier extends AsyncNotifier<OrderListState> {
  @override
  Future<OrderListState> build() async {
    final service = ref.read(orderServiceProvider);
    final orders = await service.getOrders();
    return OrderListState.fromOrders(orders);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final service = ref.read(orderServiceProvider);
      final orders = await service.getOrders();
      return OrderListState.fromOrders(orders);
    });
  }
}

final orderProvider = AsyncNotifierProvider<OrderNotifier, OrderListState>(
  OrderNotifier.new,
);

final ordersProvider = FutureProvider<List<Order>>((ref) async {
  final listState = await ref.watch(orderProvider.future);
  return listState.all;
});

final orderDetailProvider = FutureProvider.family<Order, String>((
  ref,
  orderId,
) async {
  final service = ref.read(orderServiceProvider);
  return service.getOrderById(orderId);
});

final orderPaymentProvider = FutureProvider.family<OrderPayment?, String>((
  ref,
  orderId,
) async {
  final service = ref.read(orderPaymentServiceProvider);
  return service.getPaymentByOrderId(orderId);
});

final trackingProvider = FutureProvider.family<TrackingViewData, String>((
  ref,
  orderId,
) async {
  final order = await ref.watch(orderDetailProvider(orderId).future);
  final latestShipment = order.latestShipment;

  final mapLabel = latestShipment?.trackingCode == null
      ? 'Đang chờ tạo vận đơn GHN'
      : 'Mã vận đơn: ${latestShipment!.trackingCode}';

  final etaText = switch (order.status) {
    OrderStatus.completed => 'Đã giao thành công',
    OrderStatus.cancelled => 'Đơn đã hủy',
    OrderStatus.shipped => 'Dự kiến giao trong 1-2 ngày',
    _ => 'Đang cập nhật lộ trình',
  };

  // 5-step timeline matching backend OrderStatus flow
  final statusOrder = <OrderStatus>[
    OrderStatus.pending,
    OrderStatus.confirmed,
    OrderStatus.processing,
    OrderStatus.shipped,
    OrderStatus.completed,
  ];

  final stepTitles = <String>[
    'Đặt hàng',
    'Xác nhận',
    'Đang xử lý',
    'Đang giao',
    'Hoàn thành',
  ];

  final descriptions = <String>[
    'Chúng tôi đã nhận đơn hàng của bạn.',
    'Thanh toán đã xác nhận, đơn hàng đang được sắp xếp.',
    'Đơn hàng đang được đóng gói tại kho.',
    'Đơn hàng đang trên đường giao đến bạn.',
    'Đơn hàng đã đến tay bạn.',
  ];

  final currentIndex = statusOrder.indexOf(order.status);
  final currentSafeIndex = currentIndex < 0 ? 0 : currentIndex;

  final steps = List<TrackingTimelineStep>.generate(stepTitles.length, (index) {
    final reached = order.status == OrderStatus.completed
        ? true
        : index <= currentSafeIndex;
    final current = order.status == OrderStatus.completed
        ? index == stepTitles.length - 1
        : index == currentSafeIndex;
    return TrackingTimelineStep(
      title: stepTitles[index],
      description: descriptions[index],
      timestamp: reached ? order.updatedAt : null,
      reached: reached,
      current: current,
    );
  });

  final headerMap = <OrderStatus, String>{
    OrderStatus.pending: 'Đơn hàng đang chờ xử lý',
    OrderStatus.confirmed: 'Đơn hàng đã được xác nhận',
    OrderStatus.processing: 'Đơn hàng đang được chuẩn bị',
    OrderStatus.shipped: 'Đơn hàng đang trên đường giao',
    OrderStatus.completed: 'Đơn hàng đã giao thành công',
    OrderStatus.cancelled: 'Đơn hàng đã bị hủy',
  };

  return TrackingViewData(
    header: headerMap[order.status] ?? 'Đang cập nhật',
    etaText: etaText,
    mapLabel: mapLabel,
    steps: order.status == OrderStatus.cancelled
        ? const [
            TrackingTimelineStep(
              title: 'Đã hủy',
              description:
                  'Đơn hàng đã được hủy do thanh toán thất bại hoặc theo yêu cầu.',
              timestamp: null,
              reached: true,
              current: true,
            ),
          ]
        : steps,
  );
});
