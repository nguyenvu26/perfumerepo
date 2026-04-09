import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../product/models/product.dart';
import '../services/favorite_service.dart';

class WishlistNotifier extends AsyncNotifier<List<Product>> {
  FavoriteService get _service => ref.read(favoriteServiceProvider);

  @override
  Future<List<Product>> build() async {
    return _service.list();
  }

  /// Toggle yêu thích: optimistic update rồi gọi API
  Future<void> toggle(Product product) async {
    final current = state.value ?? [];
    final alreadyFav = current.any((p) => p.id == product.id);

    // Optimistic update UI ngay lập tức
    if (alreadyFav) {
      state = AsyncData(current.where((p) => p.id != product.id).toList());
    } else {
      state = AsyncData([...current, product]);
    }

    try {
      if (alreadyFav) {
        await _service.remove(product.id);
      } else {
        // Lấy variantId đầu tiên nếu có
        final variantId = product.variants.isNotEmpty
            ? product.variants.first.id
            : null;
        await _service.add(product.id, variantId: variantId);
      }
    } catch (_) {
      // Rollback nếu API lỗi
      state = AsyncData(current);
      rethrow;
    }
  }

  bool contains(String productId) {
    return state.value?.any((p) => p.id == productId) ?? false;
  }

  void remove(String productId) {
    final current = state.value ?? [];
    state = AsyncData(current.where((p) => p.id != productId).toList());
    _service.remove(productId);
  }
}

final wishlistProvider = AsyncNotifierProvider<WishlistNotifier, List<Product>>(
  WishlistNotifier.new,
);
