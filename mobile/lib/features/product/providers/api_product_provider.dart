import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../data/product_repository.dart';
import '../models/product.dart';
import '../services/product_service.dart';

/// Providers that seamlessly switch between mock data and real API
/// based on [AppConfig.useRealAPI].
///
/// The existing UI already watches [productsProvider] etc. — these
/// overrides make the switch transparent.

// ── Real-API product providers ──────────────────────────────────────

/// All products from the NestJS backend.
final apiProductsProvider = FutureProvider<List<Product>>((ref) async {
  final repository = ref.watch(productRepositoryProvider);
  return await repository.getProducts();
});

/// Single product from the NestJS backend.
final apiProductDetailProvider = FutureProvider.family<Product, String>((
  ref,
  productId,
) async {
  final repository = ref.watch(productRepositoryProvider);
  return await repository.getProductById(productId);
});

// ── Unified providers that honour the feature flag ──────────────────

/// Drop-in replacement for the original [productsProvider].
///
/// When [AppConfig.useRealAPI] is true  → fetches from NestJS backend.
/// When false                           → uses mock [ProductService].
final unifiedProductsProvider = FutureProvider<List<Product>>((ref) async {
  if (AppConfig.useRealAPI) {
    final repository = ref.watch(productRepositoryProvider);
    return await repository.getProducts();
  }
  // Fallback to existing mock service
  final service = ProductService();
  return await service.getAllProducts();
});

/// Unified single-product provider.
final unifiedProductDetailProvider = FutureProvider.family<Product, String>((
  ref,
  productId,
) async {
  if (AppConfig.useRealAPI) {
    final repository = ref.watch(productRepositoryProvider);
    return await repository.getProductById(productId);
  }
  final service = ProductService();
  return await service.getProductById(productId);
});
