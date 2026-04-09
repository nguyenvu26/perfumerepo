import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

/// Handles all HTTP calls related to the checkout flow:
/// - [createOrder] — POST /orders (creates order from cart)
/// - [createPayOSPayment] — POST /payments/create-payment (gets PayOS link)
class CheckoutApiService {
  final ApiClient _client;

  CheckoutApiService({required ApiClient client}) : _client = client;

  /// Creates an order from the current cart. Returns the created order JSON.
  ///
  /// [paymentMethod] must be `'COD'` or `'ONLINE'`.
  Future<Map<String, dynamic>> createOrder({
    required String shippingAddress,
    required String recipientName,
    required String phone,
    required int shippingProvinceId,
    required int shippingDistrictId,
    required String shippingWardCode,
    required int shippingServiceId,
    required String paymentMethod,
    double shippingFee = 0,
    String? promotionCode,
  }) async {
    final response = await _client.post(
      ApiEndpoints.orders,
      data: {
        'shippingAddress': shippingAddress,
        'recipientName': recipientName,
        'phone': phone,
        'shippingProvinceId': shippingProvinceId,
        'shippingDistrictId': shippingDistrictId,
        'shippingWardCode': shippingWardCode,
        'shippingServiceId': shippingServiceId,
        'paymentMethod': paymentMethod,
        'shippingFee': shippingFee.round(),
        if (promotionCode != null && promotionCode.isNotEmpty)
          'promotionCode': promotionCode,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  /// Requests a PayOS checkout link for the given [orderId].
  /// Returns a map containing `checkoutUrl`, `qrCode`, etc.
  Future<Map<String, dynamic>> createPayOSPayment(String orderId) async {
    final response = await _client.post(
      ApiEndpoints.createPayosPayment,
      data: {'orderId': orderId},
    );
    return response.data as Map<String, dynamic>;
  }

  /// Gets the latest payment record for an order.
  /// Returns `null` when payment is not created yet.
  Future<Map<String, dynamic>?> getPaymentByOrderId(String orderId) async {
    final response = await _client.get(ApiEndpoints.paymentByOrderId(orderId));
    if (response.data == null) return null;
    return response.data as Map<String, dynamic>;
  }
}

final checkoutApiServiceProvider = Provider<CheckoutApiService>((ref) {
  final client = ref.watch(apiClientProvider);
  return CheckoutApiService(client: client);
});

/// Helper: extract a human-readable error message from a DioException or
/// any other exception.
String parseCheckoutError(Object e) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map) {
      final msg = data['message'];
      if (msg is List) return msg.join(', ');
      return msg?.toString() ?? e.message ?? 'Lỗi kết nối máy chủ';
    }
    return e.message ?? 'Lỗi kết nối máy chủ';
  }
  return e.toString();
}
