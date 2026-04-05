import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../models/cart_item.dart';
import 'cart_api_service.dart';

/// Repository that maps backend cart payloads into app cart models.
class CartRepository {
  final CartApiService _apiService;

  CartRepository({required CartApiService apiService})
    : _apiService = apiService;

  Future<List<CartItem>> getCartItems() async {
    final raw = await _apiService.getCart();
    return _mapCartItems(raw);
  }

  Future<List<CartItem>> addItemByVariant({
    required String variantId,
    required int quantity,
  }) async {
    final raw = await _apiService.addItem(
      variantId: variantId,
      quantity: quantity,
    );
    return _mapCartItems(raw);
  }

  Future<List<CartItem>> updateItemQuantity({
    required int itemId,
    required int quantity,
  }) async {
    final raw = await _apiService.updateItem(
      itemId: itemId,
      quantity: quantity,
    );
    return _mapCartItems(raw);
  }

  Future<List<CartItem>> removeItem(int itemId) async {
    final raw = await _apiService.removeItem(itemId);
    return _mapCartItems(raw);
  }

  List<CartItem> _mapCartItems(Map<String, dynamic> cart) {
    final rawItems = cart['items'];
    if (rawItems is! List) return const [];

    return rawItems
        .whereType<Map<String, dynamic>>()
        .map(_mapCartItem)
        .toList();
  }

  CartItem _mapCartItem(Map<String, dynamic> raw) {
    final variant = raw['variant'] is Map<String, dynamic>
        ? raw['variant'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final product = variant['product'] is Map<String, dynamic>
        ? variant['product'] as Map<String, dynamic>
        : const <String, dynamic>{};

    final images = product['images'];
    String imageUrl = '';
    if (images is List && images.isNotEmpty) {
      final first = images.first;
      if (first is Map<String, dynamic>) {
        imageUrl = first['url']?.toString() ?? '';
      }
    }

    final itemId = raw['id'];
    final quantity = raw['quantity'];
    final price = variant['price'];

    return CartItem(
      id: itemId?.toString() ?? '',
      productId: product['id']?.toString() ?? '',
      productName: product['name']?.toString() ?? 'Unknown product',
      productImage: imageUrl,
      price: price is num ? price.toDouble() : 0,
      quantity: quantity is num ? quantity.toInt() : 1,
      size: variant['name']?.toString(),
      variant: variant['name']?.toString(),
    );
  }
}

final cartApiServiceProvider = Provider<CartApiService>((ref) {
  final client = ref.watch(apiClientProvider);
  return CartApiService(client: client);
});

final cartRepositoryProvider = Provider<CartRepository>((ref) {
  return CartRepository(apiService: ref.watch(cartApiServiceProvider));
});
