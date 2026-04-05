import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/payment.dart';

class OrderPaymentService {
  final ApiClient _client;

  OrderPaymentService({required ApiClient client}) : _client = client;

  Future<OrderPayment?> getPaymentByOrderId(String orderId) async {
    final response = await _client.get(ApiEndpoints.paymentByOrderId(orderId));
    final body = response.data;
    if (body == null) return null;
    if (body is! Map) return null;
    final map = body.map((k, v) => MapEntry(k.toString(), v));
    return OrderPayment.fromJson(map);
  }
}
