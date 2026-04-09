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
  final bool isReturnLoading;
  final String? returnError;
  final String? returnSuccessMessage;

  const PosState({
    this.currentOrder,
    this.localCart = const [],
    this.customerPhone,
    this.isLoading = false,
    this.error,
    this.successMessage,
    this.isReturnLoading = false,
    this.returnError,
    this.returnSuccessMessage,
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
    bool? isReturnLoading,
    String? returnError,
    String? returnSuccessMessage,
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
      isReturnLoading: isReturnLoading ?? this.isReturnLoading,
      returnError: returnError,
      returnSuccessMessage: returnSuccessMessage,
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

  /// Resolve [rawCode] via backend barcode lookup and add one unit to cart or server order.
  /// Returns `true` if a line item was added or quantity increased.
  Future<bool> applyBarcode(String rawCode, String storeId) async {
    final code = rawCode.trim();
    if (code.isEmpty) return false;

    state = state.copyWith(isLoading: true, error: null);
    try {
      final list = await _service.searchProducts(
        barcode: code,
        storeId: storeId,
      );
      if (list.isEmpty) {
        state = state.copyWith(
          isLoading: false,
          error: 'Không tìm thấy sản phẩm với mã vạch này.',
        );
        return false;
      }

      PosVariant? match;
      String? productName;
      for (final p in list) {
        for (final v in p.variants) {
          if (v.barcode != null && v.barcode == code) {
            match = v;
            productName = p.name;
            break;
          }
        }
        if (match != null) break;
      }

      if (match == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Không tìm thấy sản phẩm với mã vạch này.',
        );
        return false;
      }

      if (match.stock <= 0) {
        state = state.copyWith(
          isLoading: false,
          error: 'Sản phẩm đã hết hàng tại quầy.',
        );
        return false;
      }

      final order = state.currentOrder;
      if (order != null && !order.isPaid) {
        int nextQty = 1;
        for (final it in order.items) {
          if (it.variantId == match.id) {
            nextQty = it.quantity + 1;
            break;
          }
        }
        if (nextQty > match.stock) {
          state = state.copyWith(
            isLoading: false,
            error: 'Vượt quá số lượng tồn kho (${match.stock}).',
          );
          return false;
        }
        final updated = await _service.upsertItem(
          orderId: order.id,
          variantId: match.id,
          quantity: nextQty,
        );
        state = state.copyWith(currentOrder: updated, isLoading: false);
        return true;
      } else {
        addToCart(match, productName ?? '');
        state = state.copyWith(isLoading: false);
        return true;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> createPosReturn({
    required String orderId,
    required List<PosOrderItem> orderItems,
    String? reason,
  }) async {
    if (orderItems.isEmpty) {
      state = state.copyWith(returnError: 'Không có sản phẩm để trả.');
      return false;
    }

    state = state.copyWith(
      isReturnLoading: true,
      returnError: null,
      returnSuccessMessage: null,
    );

    try {
      final request = CreateReturnRequest(
        orderId: orderId,
        reason: reason,
        items: orderItems
            .map(
              (e) => ReturnItemRequest(
                variantId: e.variantId,
                quantity: e.quantity,
                reason: reason,
              ),
            )
            .toList(),
      );

      final created = await _service.createPosReturn(request);
      final returnId = (created['id'] ?? '').toString();
      if (returnId.isEmpty) {
        throw Exception('Không tạo được phiếu trả hàng');
      }

      final receiveItems = orderItems
          .map(
            (e) => {
              'variantId': e.variantId,
              'qtyReceived': e.quantity,
              'condition': 'NEW_SEALED',
              'sealIntact': true,
            },
          )
          .toList();

      await _service.receiveReturn(
        returnId: returnId,
        items: receiveItems,
        receivedLocation: 'POS',
        note: 'Nhận hàng trực tiếp tại quầy',
      );

      await _service.refundReturn(
        returnId: returnId,
        method: 'cash',
        note: 'Hoàn tiền tại quầy (mobile staff)',
      );

      state = state.copyWith(
        isReturnLoading: false,
        returnSuccessMessage: 'Tạo trả hàng & hoàn tiền thành công',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isReturnLoading: false, returnError: e.toString());
      return false;
    }
  }

  void clearReturnMessages() {
    state = state.copyWith(returnError: null, returnSuccessMessage: null);
  }
}

final posProvider = StateNotifierProvider<PosNotifier, PosState>((ref) {
  final service = ref.watch(staffPosServiceProvider);
  return PosNotifier(service);
});
