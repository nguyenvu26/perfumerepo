import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_endpoints.dart';
import '../../models/staff_store.dart';
import '../models/pos_models.dart';

class StaffPosService {
  final ApiClient _client;

  StaffPosService({required ApiClient client}) : _client = client;

  /// Fetch stores assigned to current user.
  Future<List<StaffStore>> getMyStores() async {
    final response = await _client.get(ApiEndpoints.myStores);
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map((e) => StaffStore.fromJson(e))
        .toList();
  }

  /// Search products available in a store.
  Future<List<PosProduct>> searchProducts({
    String? query,
    String? storeId,
  }) async {
    final response = await _client.get(
      ApiEndpoints.staffPosProducts,
      queryParameters: {
        if (query != null && query.isNotEmpty) 'q': query,
        if (storeId != null) 'storeId': storeId,
      },
    );
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map((e) => PosProduct.fromJson(e))
        .toList();
  }

  /// Create a new draft POS order.
  Future<PosOrder> createDraftOrder({
    required String storeId,
    String? customerPhone,
  }) async {
    final response = await _client.post(
      ApiEndpoints.staffPosOrders,
      data: {
        'storeId': storeId,
        if (customerPhone != null) 'customerPhone': customerPhone,
      },
    );
    return PosOrder.fromJson(response.data as Map<String, dynamic>);
  }

  /// Attach / change customer on an order.
  Future<PosOrder> setCustomer({
    required String orderId,
    required String customerPhone,
  }) async {
    final response = await _client.patch(
      ApiEndpoints.staffPosOrderCustomer(orderId),
      data: {'customerPhone': customerPhone},
    );
    return PosOrder.fromJson(response.data as Map<String, dynamic>);
  }

  /// Add/update/remove item in a POS order.
  Future<PosOrder> upsertItem({
    required String orderId,
    required String variantId,
    required int quantity,
  }) async {
    final response = await _client.patch(
      ApiEndpoints.staffPosOrderItems(orderId),
      data: {'variantId': variantId, 'quantity': quantity},
    );
    return PosOrder.fromJson(response.data as Map<String, dynamic>);
  }

  /// Get current order details.
  Future<PosOrder> getOrder(String orderId) async {
    final response = await _client.get(ApiEndpoints.staffPosOrderById(orderId));
    return PosOrder.fromJson(response.data as Map<String, dynamic>);
  }

  /// Pay by cash.
  Future<PosOrder> payCash(String orderId) async {
    final response = await _client.post(ApiEndpoints.staffPosPayCash(orderId));
    return PosOrder.fromJson(response.data as Map<String, dynamic>);
  }

  /// Pay by QR.
  Future<Map<String, dynamic>> payQr(String orderId) async {
    final response = await _client.post(ApiEndpoints.staffPosPayQr(orderId));
    return response.data as Map<String, dynamic>;
  }

  /// Lookup customer loyalty by phone.
  Future<LoyaltyResult> lookupLoyalty(String phone) async {
    final response = await _client.get(
      ApiEndpoints.staffPosLoyalty,
      queryParameters: {'phone': phone},
    );
    return LoyaltyResult.fromJson(response.data as Map<String, dynamic>);
  }

  /// Cancel a pending POS order.
  Future<void> cancelOrder(String orderId) async {
    await _client.delete(ApiEndpoints.staffPosCancelOrder(orderId));
  }

  /// Checkout: create order + items + pay in one shot.
  /// For CASH: returns a fully paid PosOrder.
  /// For QR: returns a map with { order, checkoutUrl, ... }.
  Future<Map<String, dynamic>> checkout({
    required String storeId,
    required List<Map<String, dynamic>> items,
    required String paymentMethod,
    String? customerPhone,
  }) async {
    final response = await _client.post(
      ApiEndpoints.staffPosCheckout,
      data: {
        'storeId': storeId,
        'items': items,
        'paymentMethod': paymentMethod,
        if (customerPhone != null) 'customerPhone': customerPhone,
      },
    );
    return response.data as Map<String, dynamic>;
  }
}
