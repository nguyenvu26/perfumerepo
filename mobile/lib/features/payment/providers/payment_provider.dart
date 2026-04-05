import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/payment_method.dart';
import '../services/payment_service.dart';

// Available Payment Methods Provider
final paymentMethodsProvider = Provider<List<PaymentMethod>>((ref) {
  return [
    PaymentMethod(
      id: 'payos',
      type: PaymentMethodType.payos,
      label: 'Thanh toan online (PayOS)',
      description: 'QR / chuyen khoan nhanh',
      isEnabled: true,
    ),
    PaymentMethod(
      id: 'cod',
      type: PaymentMethodType.cod,
      label: 'Thanh toan khi nhan hang (COD)',
      description: 'Thanh toan khi nhan hang',
      isDefault: true,
      isEnabled: true,
    ),
  ];
});

// Selected Payment Method State
class SelectedPaymentMethodNotifier extends StateNotifier<PaymentMethod?> {
  SelectedPaymentMethodNotifier() : super(null);

  void select(PaymentMethod method) {
    state = method;
  }

  void clear() {
    state = null;
  }
}

final selectedPaymentMethodProvider =
    StateNotifierProvider<SelectedPaymentMethodNotifier, PaymentMethod?>((ref) {
      return SelectedPaymentMethodNotifier();
    });

// Payment Actions Provider
final paymentActionsProvider = Provider<PaymentActions>((ref) {
  return PaymentActions(ref);
});

class PaymentActions {
  final Ref ref;

  PaymentActions(this.ref);

  // Process payment based on selected method
  Future<PaymentResult> processPayment({
    required String orderId,
    required double amount,
    required String orderInfo,
    String? shippingAddress,
  }) async {
    final selectedMethod = ref.read(selectedPaymentMethodProvider);

    if (selectedMethod == null) {
      return PaymentResult(
        success: false,
        message: 'Vui lòng chọn phương thức thanh toán',
      );
    }

    final service = ref.read(paymentServiceProvider);

    try {
      switch (selectedMethod.type) {
        case PaymentMethodType.vnpay:
          final response = await service.createVNPayPayment(
            orderId: orderId,
            amount: amount,
            orderInfo: orderInfo,
          );
          return PaymentResult(
            success: response['success'] as bool? ?? false,
            paymentUrl: response['paymentUrl'] as String?,
            message:
                response['message'] as String? ?? 'Đang chuyển đến VNPay...',
          );

        case PaymentMethodType.momo:
          final response = await service.createMomoPayment(
            orderId: orderId,
            amount: amount,
            orderInfo: orderInfo,
          );
          return PaymentResult(
            success: response['success'] as bool? ?? false,
            paymentUrl: response['paymentUrl'] as String?,
            message:
                response['message'] as String? ?? 'Đang chuyển đến MoMo...',
          );

        case PaymentMethodType.cod:
          final response = await service.createCODOrder(
            orderId: orderId,
            amount: amount,
            shippingAddress: shippingAddress ?? '',
          );
          return PaymentResult(
            success: response['success'] as bool? ?? false,
            message:
                response['message'] as String? ??
                'Đã tạo đơn thanh toán khi nhận hàng',
          );

        case PaymentMethodType.payos:
          // PayOS is handled directly in CheckoutNotifier via CheckoutApiService.
          // Reaching here would be a logic error, but return a safe fallback.
          return PaymentResult(
            success: false,
            message: 'PayOS được xử lý qua màn hình thanh toán.',
          );
      }
    } catch (e) {
      return PaymentResult(success: false, message: 'Thanh toán thất bại: $e');
    }
  }

  // Verify payment callback
  Future<bool> verifyPaymentCallback(
    PaymentMethodType method,
    Map<String, dynamic> params,
  ) async {
    final service = ref.read(paymentServiceProvider);

    try {
      final response = await service.verifyPaymentCallback(
        method: method,
        params: params,
      );
      return response['success'] as bool? ?? false;
    } catch (e) {
      return false;
    }
  }

  // Get payment status
  Future<PaymentTransaction?> getPaymentStatus(String orderId) async {
    final service = ref.read(paymentServiceProvider);
    return service.getPaymentStatus(orderId);
  }

  // Cancel payment
  Future<bool> cancelPayment(String orderId) async {
    final service = ref.read(paymentServiceProvider);
    return service.cancelPayment(orderId);
  }

  // Get payment history
  Future<List<PaymentTransaction>> getPaymentHistory() async {
    final service = ref.read(paymentServiceProvider);
    return service.getPaymentHistory();
  }
}

class PaymentResult {
  final bool success;
  final String message;
  final String? paymentUrl;
  final String? transactionId;

  PaymentResult({
    required this.success,
    required this.message,
    this.paymentUrl,
    this.transactionId,
  });
}
