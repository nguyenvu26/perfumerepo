import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/product.dart';
import 'product_api_service.dart';

/// Repository that maps raw API data to domain [Product] objects.
///
/// The UI should depend on this repository (via Riverpod providers)
/// instead of calling the API service directly.
class ProductRepository {
  final ProductApiService _apiService;

  ProductRepository({required ProductApiService apiService})
    : _apiService = apiService;

  /// Fetch all products, optionally filtered.
  Future<List<Product>> getProducts({
    int? skip,
    int? take,
    int? categoryId,
    int? brandId,
    String? search,
  }) async {
    final rawList = await _apiService.getProducts(
      skip: skip,
      take: take,
      categoryId: categoryId,
      brandId: brandId,
      search: search,
    );
    return rawList
        .map((json) => Product.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Fetch a single product by its ID.
  Future<Product> getProductById(String id) async {
    final json = await _apiService.getProductById(id);
    return Product.fromJson(json);
  }
}

// ── Riverpod Providers ────────────────────────────────────────────────

final productApiServiceProvider = Provider<ProductApiService>((ref) {
  final client = ref.watch(apiClientProvider);
  return ProductApiService(client: client);
});

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(apiService: ref.watch(productApiServiceProvider));
});
