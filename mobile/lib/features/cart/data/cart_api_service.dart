import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

/// Low-level API service for cart endpoints.
///
/// This service only handles HTTP requests/responses.
class CartApiService {
  final ApiClient _client;

  CartApiService({required ApiClient client}) : _client = client;

  Future<Map<String, dynamic>> getCart() async {
    final response = await _client.get(ApiEndpoints.cart);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> addItem({
    required String variantId,
    required int quantity,
  }) async {
    final response = await _client.post(
      ApiEndpoints.cartItems,
      data: {'variantId': variantId, 'quantity': quantity},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateItem({
    required int itemId,
    required int quantity,
  }) async {
    final response = await _client.patch(
      ApiEndpoints.cartItem(itemId),
      data: {'quantity': quantity},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> removeItem(int itemId) async {
    final response = await _client.delete(ApiEndpoints.cartItem(itemId));
    return response.data as Map<String, dynamic>;
  }
}
