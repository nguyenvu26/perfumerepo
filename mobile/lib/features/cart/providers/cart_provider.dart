import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_repository.dart';
import '../data/cart_repository.dart';
import '../models/cart_item.dart';

class CartState {
  final List<CartItem> items;
  final String? promoCode;
  final double promoDiscount; // 0.0-1.0 for PERCENTAGE, or raw VND for FIXED
  final String? promoDiscountType; // 'PERCENTAGE' or 'FIXED_AMOUNT'
  final double promoDiscountRaw; // raw discountAmount from API (VND)
  final bool isLoading;
  final String? error;

  CartState({
    this.items = const [],
    this.promoCode,
    this.promoDiscount = 0.0,
    this.promoDiscountType,
    this.promoDiscountRaw = 0.0,
    this.isLoading = false,
    this.error,
  });

  double get subtotal => items.fold(0.0, (sum, item) => sum + item.subtotal);
  double get discount => promoDiscountType == 'FIXED_AMOUNT'
      ? promoDiscountRaw
      : subtotal * promoDiscount;
  double get total => (subtotal - discount).clamp(0, double.infinity);
  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  CartState copyWith({
    List<CartItem>? items,
    String? promoCode,
    double? promoDiscount,
    String? promoDiscountType,
    double? promoDiscountRaw,
    bool? isLoading,
    String? error,
  }) {
    return CartState(
      items: items ?? this.items,
      promoCode: promoCode ?? this.promoCode,
      promoDiscount: promoDiscount ?? this.promoDiscount,
      promoDiscountType: promoDiscountType ?? this.promoDiscountType,
      promoDiscountRaw: promoDiscountRaw ?? this.promoDiscountRaw,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  final CartRepository _repository;
  final AuthRepository _authRepository;

  CartNotifier({
    required CartRepository repository,
    required AuthRepository authRepository,
  }) : _repository = repository,
       _authRepository = authRepository,
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

  // Apply promo code via API
  Future<void> applyPromoCode(String code) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final amount = state.subtotal.toInt();
      if (amount <= 0) {
        state = state.copyWith(
          isLoading: false,
          error: 'Giỏ hàng trống, không thể áp dụng mã',
        );
        return;
      }

      final result = await _authRepository.validatePromoCode(
        code: code,
        amount: amount,
      );

      final discountType = result['discountType'] as String?;
      final discountAmount =
          (result['discountAmount'] as num?)?.toDouble() ?? 0;
      final discountValue = (result['discountValue'] as num?)?.toDouble() ?? 0;

      state = state.copyWith(
        promoCode: code,
        promoDiscount: discountType == 'PERCENTAGE' ? discountValue / 100 : 0,
        promoDiscountType: discountType,
        promoDiscountRaw: discountAmount,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _mapError(e));
    }
  }

  // Remove promo code
  void removePromoCode() {
    state = CartState(items: state.items, isLoading: false);
  }
}

// Provider
final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier(
    repository: ref.watch(cartRepositoryProvider),
    authRepository: ref.watch(authRepositoryProvider),
  );
});
