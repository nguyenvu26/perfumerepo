import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/order.dart';

class OrderService {
  final ApiClient _client;

  OrderService({required ApiClient client}) : _client = client;

  Future<List<Order>> getOrders() async {
    final response = await _client.get(ApiEndpoints.orders);
    final body = response.data;
    final data = body is List
        ? body
        : (body is Map<String, dynamic> && body['data'] is List)
              ? body['data'] as List
              : const <dynamic>[];

    final orders = <Order>[];
    for (final item in data) {
      if (item is! Map) continue;
      final orderJson = item.map((k, v) => MapEntry(k.toString(), v));
      final orderId = (orderJson['id'] ?? '').toString();
      final shipments = orderId.isEmpty ? const <ShipmentInfo>[] : await getShipmentsByOrderId(orderId);
      orders.add(Order.fromJson(orderJson, shipments: shipments));
    }

    orders.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return orders;
  }

  Future<Order> getOrderById(String orderId) async {
    final response = await _client.get(ApiEndpoints.orderById(orderId));
    final body = response.data;
    if (body is! Map) {
      throw Exception('Khong the doc chi tiet don hang.');
    }

    final orderJson = body.map((k, v) => MapEntry(k.toString(), v));
    final shipments = await getShipmentsByOrderId(orderId);
    return Order.fromJson(orderJson, shipments: shipments);
  }

  Future<List<ShipmentInfo>> getShipmentsByOrderId(String orderId) async {
    final response = await _client.get(ApiEndpoints.shipmentsByOrderId(orderId));
    final body = response.data;
    if (body is! List) return const <ShipmentInfo>[];
    return body
        .whereType<Map>()
        .map((it) => ShipmentInfo.fromJson(it.map((k, v) => MapEntry(k.toString(), v))))
        .toList();
  }
}
