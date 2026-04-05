import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/utils/api_error_mapper.dart';
import '../../product/models/product.dart';

class FavoriteService {
  final ApiClient _client;
  FavoriteService(this._client);

  /// GET /favorites — returns list of favorited products
  Future<List<Product>> list() async {
    try {
      final resp = await _client.dio.get<List<dynamic>>('/favorites');
      final items = resp.data ?? [];
      return items
          .whereType<Map<String, dynamic>>()
          .map((item) {
            final productJson = item['product'] as Map<String, dynamic>?;
            if (productJson == null) return null;
            return Product.fromJson(productJson);
          })
          .whereType<Product>()
          .toList();
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }

  /// GET /favorites/:productId/status → { isFavorite: bool }
  Future<bool> isFavorite(String productId) async {
    try {
      final resp = await _client.dio.get<Map<String, dynamic>>(
        '/favorites/$productId/status',
      );
      return resp.data?['isFavorite'] == true;
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }

  /// POST /favorites/:productId
  Future<void> add(String productId, {String? variantId}) async {
    try {
      await _client.dio.post<void>(
        '/favorites/$productId',
        data: variantId != null ? {'variantId': variantId} : {},
      );
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }

  /// DELETE /favorites/:productId
  Future<void> remove(String productId) async {
    try {
      await _client.dio.delete<void>('/favorites/$productId');
    } catch (e) {
      throw ApiErrorMapper.toUserMessage(e);
    }
  }
}

final favoriteServiceProvider = Provider<FavoriteService>((ref) {
  return FavoriteService(ref.watch(apiClientProvider));
});
