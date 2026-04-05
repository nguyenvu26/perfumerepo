import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../address/models/address.dart';
import '../../address/providers/address_providers.dart';
import '../../address/services/address_service.dart';
import '../data/checkout_api_service.dart';
import '../models/checkout_state.dart';
import '../../cart/providers/cart_provider.dart';
import '../../payment/models/payment_method.dart';
import '../../payment/providers/payment_method_provider.dart';

class CheckoutNotifier extends StateNotifier<CheckoutState> {
  final Ref _ref;
  CheckoutApiService get _api => _ref.read(checkoutApiServiceProvider);

  CheckoutNotifier({required Ref ref, PaymentMethod? initialPaymentMethod})
    : _ref = ref,
      super(
        CheckoutState(
          selectedPaymentMethod:
              initialPaymentMethod ??
              PaymentMethod(
                id: PaymentMethodType.cod.backendValue.toLowerCase(),
                type: PaymentMethodType.cod,
                label: PaymentMethodType.cod.displayName,
                description: PaymentMethodType.cod.description,
                isDefault: true,
              ),
        ),
      );

  void syncWithCartState(CartState cartState) {
    // Once an order is created the backend clears the cart.
    // Don't let that empty-cart signal overwrite the checkout UI.
    if (state.createdOrderId != null) return;

    final subtotal = cartState.items.fold<double>(
      0,
      (sum, item) => sum + item.subtotal,
    );

    state = state.copyWith(
      orderItems: cartState.items,
      subtotal: subtotal,
      shippingCost: 0,
      tax: 0,
      isCartLoading: cartState.isLoading,
      cartError: cartState.error,
    );
  }

  Future<void> refreshCart() async {
    await _ref.read(cartProvider.notifier).loadCart();
  }

  Future<void> selectAddress(Address address) async {
    _ref.read(selectedAddressProvider.notifier).state = address;
    await _applyAddressWithShippingFee(address);
  }

  Future<void> syncSelectedAddress(Address? address) async {
    if (address == null) {
      state = state.copyWith(clearSelectedAddress: true, shippingCost: 0);
      return;
    }
    await _applyAddressWithShippingFee(address);
  }

  Future<void> _applyAddressWithShippingFee(Address address) async {
    state = state.copyWith(selectedAddress: address);

    try {
      final fee = await _ref
          .read(addressServiceProvider)
          .calculateShippingFee(
            districtId: address.districtId,
            wardCode: address.wardCode,
            serviceId: address.serviceId,
            codValue: state.subtotal.round(),
          );

      state = state.copyWith(shippingCost: fee.toDouble(), errorMessage: null);
    } catch (error) {
      state = state.copyWith(
        shippingCost: 0,
        errorMessage: parseAddressError(error),
      );
    }
  }

  void selectPaymentMethod(PaymentMethod method) {
    state = state.copyWith(selectedPaymentMethod: method);
  }

  String? get selectedPaymentMethodId => state.selectedPaymentMethod?.id;

  /// Returns true only when backend confirms payment status is PAID.
  Future<bool> isOnlinePaymentPaid() async {
    final orderId = state.createdOrderId;
    if (orderId == null || orderId.isEmpty) return false;

    try {
      final payment = await _api.getPaymentByOrderId(orderId);
      final status = (payment?['status'] ?? '').toString().trim().toUpperCase();
      return status == 'PAID';
    } catch (e) {
      state = state.copyWith(errorMessage: parseCheckoutError(e));
      return false;
    }
  }

  /// Creates the order and, for online payment, fetches a PayOS checkout URL.
  ///
  /// Returns `true` on success. On success:
  /// - [CheckoutState.createdOrderId] is set to the new order's ID.
  /// - [CheckoutState.payosCheckoutUrl] is non-null when online payment is
  ///   required — the caller should open this URL in an external browser.
  Future<bool> confirmOrder() async {
    // Order already created + PayOS URL ready: just signal for re-launch.
    if (state.pendingOnlinePayment) return true;

    // Order already created but payment link missing: retry link creation.
    final existingOrderId = state.createdOrderId;
    final isOnlineMethod =
        state.selectedPaymentMethod?.type.requiresOnlinePayment ?? false;
    if (existingOrderId != null && isOnlineMethod) {
      state = state.copyWith(isSubmitting: true, errorMessage: null);
      try {
        final paymentData = await _api.createPayOSPayment(existingOrderId);
        final checkoutUrl = paymentData['checkoutUrl'] as String?;
        if (checkoutUrl == null || checkoutUrl.isEmpty) {
          throw Exception('Không nhận được link thanh toán');
        }

        state = state.copyWith(
          isSubmitting: false,
          payosCheckoutUrl: checkoutUrl,
        );
        return true;
      } catch (e) {
        state = state.copyWith(
          isSubmitting: false,
          errorMessage: parseCheckoutError(e),
        );
        return false;
      }
    }

    if (!state.canConfirm) return false;

    state = state.copyWith(isSubmitting: true, errorMessage: null);

    try {
      final address = state.selectedAddress!;
      final paymentType = state.selectedPaymentMethod!.type;
      final isOnline = paymentType.requiresOnlinePayment;

      // 1. Create order
      final orderData = await _api.createOrder(
        shippingAddress: address.fullAddress,
        recipientName: address.recipientName,
        phone: address.phone,
        shippingProvinceId: address.provinceId,
        shippingDistrictId: address.districtId,
        shippingWardCode: address.wardCode,
        shippingServiceId: address.serviceId,
        paymentMethod: isOnline ? 'ONLINE' : 'COD',
        shippingFee: state.shippingCost,
      );

      final orderId = orderData['id'] as String? ?? '';

      if (orderId.isEmpty) {
        throw Exception('Không tạo được đơn hàng');
      }

      // Persist the created order immediately.
      state = state.copyWith(createdOrderId: orderId);

      if (isOnline) {
        // 2. Get PayOS link
        final paymentData = await _api.createPayOSPayment(orderId);
        final checkoutUrl = paymentData['checkoutUrl'] as String?;
        if (checkoutUrl == null || checkoutUrl.isEmpty) {
          throw Exception('Không nhận được link thanh toán');
        }

        state = state.copyWith(
          isSubmitting: false,
          payosCheckoutUrl: checkoutUrl,
        );
      } else {
        state = state.copyWith(isSubmitting: false, createdOrderId: orderId);
      }

      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: parseCheckoutError(e),
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}

final checkoutProvider = StateNotifierProvider<CheckoutNotifier, CheckoutState>(
  (ref) {
    // Initialize with the user's persisted payment preference.
    final preferredMethod = ref.read(selectedPaymentMethodProvider);
    final notifier = CheckoutNotifier(
      ref: ref,
      initialPaymentMethod: preferredMethod,
    );
    final selectedAddress = ref.read(selectedAddressProvider);

    notifier.syncWithCartState(ref.read(cartProvider));
    if (selectedAddress != null) {
      notifier.syncSelectedAddress(selectedAddress);
    }

    ref.listen<CartState>(cartProvider, (previous, next) {
      notifier.syncWithCartState(next);
    });

    ref.listen<Address?>(selectedAddressProvider, (previous, next) {
      notifier.syncSelectedAddress(next);
    });

    ref.listen<AsyncValue<List<Address>>>(addressListProvider, (
      previous,
      next,
    ) {
      next.whenData((_) {
        final updated = ref.read(selectedAddressProvider);
        notifier.syncSelectedAddress(updated);
      });
    });

    // Keep checkout in sync when the user changes their preferred method
    // (e.g. from the preference screen).
    ref.listen<PaymentMethod?>(selectedPaymentMethodProvider, (prev, next) {
      if (next != null && notifier.selectedPaymentMethodId != next.id) {
        notifier.selectPaymentMethod(next);
      }
    });

    final initialCartState = ref.read(cartProvider);
    if (initialCartState.items.isEmpty && !initialCartState.isLoading) {
      notifier.refreshCart();
    }

    return notifier;
  },
);
