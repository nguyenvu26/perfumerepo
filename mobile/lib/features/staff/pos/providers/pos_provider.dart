import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_client.dart';
import '../../models/staff_store.dart';
import '../models/pos_models.dart';
import '../services/pos_service.dart';

// ── Service Provider ────────────────────────────────────────────────

final staffPosServiceProvider = Provider<StaffPosService>((ref) {
  final client = ref.watch(apiClientProvider);
  return StaffPosService(client: client);
});

// ── Store List ──────────────────────────────────────────────────────

final posStoresProvider = FutureProvider<List<StaffStore>>((ref) async {
  final service = ref.watch(staffPosServiceProvider);
  return service.getMyStores();
});

// ── Selected Store ──────────────────────────────────────────────────

final posSelectedStoreIdProvider = StateProvider<String?>((ref) => null);

// ── Product Search ──────────────────────────────────────────────────

final posSearchQueryProvider = StateProvider<String>((ref) => '');

final posProductsProvider = FutureProvider<List<PosProduct>>((ref) async {
  final service = ref.watch(staffPosServiceProvider);
  final storeId = ref.watch(posSelectedStoreIdProvider);
  final query = ref.watch(posSearchQueryProvider);
  if (storeId == null) return const [];
  return service.searchProducts(query: query, storeId: storeId);
});

// ── POS Order State ─────────────────────────────────────────────────

class PosState {
  /// Server-side order (used for edit mode or after checkout).
  final PosOrder? currentOrder;

  /// Local cart items (new order mode — no backend draft).
  final List<LocalCartItem> localCart;

  /// Attached customer phone (before checkout).
  final String? customerPhone;

  final bool isLoading;
  final String? error;
  final String? successMessage;

  const PosState({
    this.currentOrder,
    this.localCart = const [],
    this.customerPhone,
    this.isLoading = false,
    this.error,
    this.successMessage,
  });

  /// Whether we're editing a server-side order (from Orders tab).
  bool get isEditMode => currentOrder != null && !currentOrder!.isPaid;

  /// Whether we're in local-cart new-order mode.
  bool get isNewOrderMode => currentOrder == null;

  double get localCartTotal =>
      localCart.fold(0.0, (sum, item) => sum + item.totalPrice);

  PosState copyWith({
    PosOrder? currentOrder,
    List<LocalCartItem>? localCart,
    String? customerPhone,
    bool? isLoading,
    String? error,
    String? successMessage,
    bool clearOrder = false,
    bool clearCustomer = false,
  }) {
    return PosState(
      currentOrder: clearOrder ? null : (currentOrder ?? this.currentOrder),
      localCart: localCart ?? this.localCart,
      customerPhone: clearCustomer
          ? null
          : (customerPhone ?? this.customerPhone),
      isLoading: isLoading ?? this.isLoading,
      error: error,
      successMessage: successMessage,
    );
  }
}

class PosNotifier extends StateNotifier<PosState> {
  final StaffPosService _service;

  PosNotifier(this._service) : super(const PosState());

  // ── Local Cart Operations (new order mode) ────────────────────

  void addToCart(PosVariant variant, String productName) {
    final cart = List<LocalCartItem>.from(state.localCart);
    final idx = cart.indexWhere((c) => c.variantId == variant.id);
    if (idx >= 0) {
      if (cart[idx].quantity < variant.stock) {
        cart[idx].quantity++;
      }
    } else {
      cart.add(
        LocalCartItem(
          variantId: variant.id,
          variantName: variant.name,
          productName: productName,
          price: variant.price,
          stock: variant.stock,
        ),
      );
    }
    state = state.copyWith(localCart: cart);
  }

  void updateCartQuantity(String variantId, int quantity) {
    final cart = List<LocalCartItem>.from(state.localCart);
    if (quantity <= 0) {
      cart.removeWhere((c) => c.variantId == variantId);
    } else {
      final idx = cart.indexWhere((c) => c.variantId == variantId);
      if (idx >= 0) {
        cart[idx].quantity = quantity;
      }
    }
    state = state.copyWith(localCart: cart);
  }

  void removeFromCart(String variantId) {
    final cart = List<LocalCartItem>.from(state.localCart);
    cart.removeWhere((c) => c.variantId == variantId);
    state = state.copyWith(localCart: cart);
  }

  void setCustomerPhone(String phone) {
    state = state.copyWith(customerPhone: phone);
  }

  // ── Checkout (one-shot create + pay) ──────────────────────────

  Future<Map<String, dynamic>?> checkoutCash(String storeId) async {
    if (state.localCart.isEmpty) return null;
    state = state.copyWith(isLoading: true, error: null, successMessage: null);
    try {
      final result = await _service.checkout(
        storeId: storeId,
        items: state.localCart.map((c) => c.toCheckoutJson()).toList(),
        paymentMethod: 'CASH',
        customerPhone: state.customerPhone,
      );
      final order = PosOrder.fromJson(result);
      state = PosState(
        currentOrder: order,
        successMessage: 'Thanh toán thành công!',
      );
      return result;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }

  Future<Map<String, dynamic>?> checkoutQr(String storeId) async {
    if (state.localCart.isEmpty) return null;
    state = state.copyWith(isLoading: true, error: null, successMessage: null);
    try {
      final result = await _service.checkout(
        storeId: storeId,
        items: state.localCart.map((c) => c.toCheckoutJson()).toList(),
        paymentMethod: 'QR',
        customerPhone: state.customerPhone,
      );
      // QR returns { order: {...}, checkoutUrl: "..." }
      state = state.copyWith(isLoading: false);
      return result;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }

  // ── Edit-mode operations (existing server-side order) ─────────

  Future<void> createDraft(String storeId) async {
    state = state.copyWith(isLoading: true, error: null, successMessage: null);
    try {
      final order = await _service.createDraftOrder(storeId: storeId);
      state = PosState(currentOrder: order);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> addItem(String variantId, int quantity) async {
    final order = state.currentOrder;
    if (order == null) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updated = await _service.upsertItem(
        orderId: order.id,
        variantId: variantId,
        quantity: quantity,
      );
      state = PosState(currentOrder: updated);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> updateItemQuantity(String variantId, int quantity) async {
    final order = state.currentOrder;
    if (order == null) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updated = await _service.upsertItem(
        orderId: order.id,
        variantId: variantId,
        quantity: quantity,
      );
      state = PosState(currentOrder: updated);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> removeItem(String variantId) async {
    await updateItemQuantity(variantId, 0);
  }

  Future<void> setCustomer(String phone) async {
    final order = state.currentOrder;
    if (order == null) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updated = await _service.setCustomer(
        orderId: order.id,
        customerPhone: phone,
      );
      state = PosState(currentOrder: updated);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> payCash() async {
    final order = state.currentOrder;
    if (order == null) return;
    state = state.copyWith(isLoading: true, error: null, successMessage: null);
    try {
      final paid = await _service.payCash(order.id);
      state = PosState(
        currentOrder: paid,
        successMessage: 'Thanh toán thành công!',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Load an existing pending order to continue editing.
  Future<void> loadExistingOrder(String orderId, {String? storeId}) async {
    state = state.copyWith(isLoading: true, error: null, successMessage: null);
    try {
      final order = await _service.getOrder(orderId);
      state = PosState(currentOrder: order);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Cancel a pending POS order.
  Future<bool> cancelOrder(String orderId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _service.cancelOrder(orderId);
      state = const PosState();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  void clearOrder() {
    state = const PosState();
  }
}

final posProvider = StateNotifierProvider<PosNotifier, PosState>((ref) {
  final service = ref.watch(staffPosServiceProvider);
  return PosNotifier(service);
});
