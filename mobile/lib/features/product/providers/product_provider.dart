import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../data/product_repository.dart';
import '../models/product.dart';
import '../services/product_service.dart';

final productServiceProvider = Provider<ProductService>((ref) {
  return ProductService();
});

final productsProvider = FutureProvider<List<Product>>((ref) async {
  if (AppConfig.useRealAPI) {
    final repository = ref.watch(productRepositoryProvider);
    return await repository.getProducts(take: 20);
  }

  final service = ref.watch(productServiceProvider);
  return await service.getAllProducts();
});

final personalizedProductsProvider = FutureProvider<List<Product>>((ref) async {
  if (AppConfig.useRealAPI) {
    final products = await ref.watch(productsProvider.future);
    return products.take(6).toList();
  }

  final service = ref.watch(productServiceProvider);
  return await service.getPersonalizedProducts();
});

final recommendedProductsProvider = FutureProvider<List<Product>>((ref) async {
  if (AppConfig.useRealAPI) {
    final products = await ref.watch(productsProvider.future);
    if (products.length <= 3) return products;
    return products.skip(2).take(6).toList();
  }

  final service = ref.watch(productServiceProvider);
  return await service.getRecommendedProducts();
});

final productDetailProvider = FutureProvider.family<Product, String>((
  ref,
  productId,
) async {
  if (AppConfig.useRealAPI) {
    final repository = ref.watch(productRepositoryProvider);
    return await repository.getProductById(productId);
  }

  final service = ref.watch(productServiceProvider);
  return await service.getProductById(productId);
});
