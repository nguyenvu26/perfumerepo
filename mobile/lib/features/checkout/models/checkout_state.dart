import '../../cart/models/cart_item.dart';
import '../../address/models/address.dart';
import '../../payment/models/payment_method.dart';

class CheckoutState {
  final Address? selectedAddress;
  final PaymentMethod? selectedPaymentMethod;
  final List<CartItem> orderItems;
  final double subtotal;
  final double shippingCost;
  final double tax;
  final bool isCartLoading;
  final String? cartError;
  final bool isSubmitting;
  final String? errorMessage;
  final String? createdOrderId;
  final String? payosCheckoutUrl;

  const CheckoutState({
    this.selectedAddress,
    this.selectedPaymentMethod,
    this.orderItems = const [],
    this.subtotal = 0,
    this.shippingCost = 0,
    this.tax = 0,
    this.isCartLoading = false,
    this.cartError,
    this.isSubmitting = false,
    this.errorMessage,
    this.createdOrderId,
    this.payosCheckoutUrl,
  });

  double get totalAmount => subtotal + shippingCost + tax;

  /// True when the order has been created and is awaiting online payment.
  bool get pendingOnlinePayment =>
      createdOrderId != null &&
      payosCheckoutUrl != null &&
      payosCheckoutUrl!.isNotEmpty;

  bool get canConfirm =>
      !isSubmitting &&
      // Re-open PayOS link if order already created
      (pendingOnlinePayment ||
          (selectedAddress != null &&
              selectedPaymentMethod != null &&
              orderItems.isNotEmpty &&
              !isCartLoading &&
              cartError == null));

  CheckoutState copyWith({
    Address? selectedAddress,
    PaymentMethod? selectedPaymentMethod,
    List<CartItem>? orderItems,
    double? subtotal,
    double? shippingCost,
    double? tax,
    bool? isCartLoading,
    String? cartError,
    bool? isSubmitting,
    String? errorMessage,
    String? createdOrderId,
    String? payosCheckoutUrl,
    bool clearSelectedAddress = false,
  }) {
    return CheckoutState(
      selectedAddress: clearSelectedAddress
          ? null
          : (selectedAddress ?? this.selectedAddress),
      selectedPaymentMethod:
          selectedPaymentMethod ?? this.selectedPaymentMethod,
      orderItems: orderItems ?? this.orderItems,
      subtotal: subtotal ?? this.subtotal,
      shippingCost: shippingCost ?? this.shippingCost,
      tax: tax ?? this.tax,
      isCartLoading: isCartLoading ?? this.isCartLoading,
      cartError: cartError,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
      createdOrderId: createdOrderId ?? this.createdOrderId,
      payosCheckoutUrl: payosCheckoutUrl,
    );
  }
}
