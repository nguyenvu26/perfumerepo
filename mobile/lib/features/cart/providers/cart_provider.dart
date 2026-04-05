import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/cart_repository.dart';
import '../models/cart_item.dart';

class CartState {
  final List<CartItem> items;
  final String? promoCode;
  final double promoDiscount;
  final bool isLoading;
  final String? error;

  CartState({
    this.items = const [],
    this.promoCode,
    this.promoDiscount = 0.0,
    this.isLoading = false,
    this.error,
  });

  double get subtotal => items.fold(0.0, (sum, item) => sum + item.subtotal);
  double get discount => subtotal * promoDiscount;
  double get total => subtotal - discount;
  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  CartState copyWith({
    List<CartItem>? items,
    String? promoCode,
    double? promoDiscount,
    bool? isLoading,
    String? error,
  }) {
    return CartState(
      items: items ?? this.items,
      promoCode: promoCode ?? this.promoCode,
      promoDiscount: promoDiscount ?? this.promoDiscount,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  final CartRepository _repository;

  CartNotifier({required CartRepository repository})
    : _repository = repository,
      super(CartState()) {
    loadCart();
  }

  String _mapError(Object error) {
    final raw = error.toString();
    if (raw.startsWith('Exception: ')) {
      return raw.replaceFirst('Exception: ', '');
    }
    return raw;
  }

  Future<void> loadCart() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final items = await _repository.getCartItems();
      state = state.copyWith(items: items, isLoading: false, error: null);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
    }
  }

  Future<void> addItemByVariant(String variantId, {int quantity = 1}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final items = await _repository.addItemByVariant(
        variantId: variantId,
        quantity: quantity,
      );
      state = state.copyWith(items: items, isLoading: false, error: null);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
      rethrow;
    }
  }

  // Update item quantity
  Future<void> updateQuantity(String itemId, int quantity) async {
    final parsedItemId = int.tryParse(itemId);
    if (parsedItemId == null) {
      state = state.copyWith(error: 'Cart item ID is invalid.');
      return;
    }

    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final items = await _repository.updateItemQuantity(
        itemId: parsedItemId,
        quantity: quantity,
      );
      state = state.copyWith(items: items, isLoading: false, error: null);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
    }
  }

  // Remove item from cart
  Future<void> removeItem(String itemId) async {
    final parsedItemId = int.tryParse(itemId);
    if (parsedItemId == null) {
      state = state.copyWith(error: 'Cart item ID is invalid.');
      return;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final items = await _repository.removeItem(parsedItemId);
      state = state.copyWith(items: items, isLoading: false, error: null);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
    }
  }

  // Clear cart
  Future<void> clearCart() async {
    final currentItems = List<CartItem>.from(state.items);
    if (currentItems.isEmpty) return;

    state = state.copyWith(isLoading: true, error: null);
    try {
      var updatedItems = currentItems;
      for (final item in currentItems) {
        final parsedItemId = int.tryParse(item.id);
        if (parsedItemId == null) continue;
        updatedItems = await _repository.removeItem(parsedItemId);
      }
      state = state.copyWith(
        items: updatedItems,
        isLoading: false,
        error: null,
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
    }
  }

  // Apply promo code
  Future<void> applyPromoCode(String code) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Call API to validate promo code
      await Future.delayed(const Duration(seconds: 1));

      // Mock validation
      if (code.toUpperCase() == 'LUMINA10') {
        state = state.copyWith(
          promoCode: code,
          promoDiscount: 0.10, // 10% discount
          isLoading: false,
        );
      } else if (code.toUpperCase() == 'WELCOME20') {
        state = state.copyWith(
          promoCode: code,
          promoDiscount: 0.20, // 20% discount
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: 'Mã khuyến mãi không hợp lệ',
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // Remove promo code
  void removePromoCode() {
    state = state.copyWith(promoCode: null, promoDiscount: 0.0);
  }
}

// Provider
final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier(repository: ref.watch(cartRepositoryProvider));
});
