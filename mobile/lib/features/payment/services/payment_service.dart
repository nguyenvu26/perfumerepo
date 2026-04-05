import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/payment_method.dart';

class PaymentService {
  final ApiClient _client;

  PaymentService({required ApiClient client}) : _client = client;

  Future<List<PaymentMethod>> getPaymentMethods() async {
    try {
      final response = await _client.get(ApiEndpoints.paymentMethods);
      final rawList = _asList(response.data);

      final methods = rawList
          .whereType<Map>()
          .map((raw) => PaymentMethod.fromJson(_asMap(raw)))
          .toList();

      return _normalizeSingleDefault(methods);
    } on DioException catch (error) {
      throw PaymentServiceException(_messageFromDio(error));
    } catch (_) {
      throw const PaymentServiceException(
        'Khong the tai danh sach phuong thuc thanh toan.',
      );
    }
  }

  Future<void> setDefaultPaymentMethod(String id) async {
    try {
      await _client.patch(ApiEndpoints.paymentMethodDefaultById(id));
    } on DioException catch (error) {
      throw PaymentServiceException(_messageFromDio(error));
    } catch (_) {
      throw const PaymentServiceException(
        'Khong the cap nhat phuong thuc thanh toan.',
      );
    }
  }

  /// Create payment for VNPay
  /// Returns payment URL to redirect user
  Future<Map<String, dynamic>> createVNPayPayment({
    required String orderId,
    required double amount,
    required String orderInfo,
  }) async {
    return {
      'success': false,
      'message': 'VNPay hien khong duoc ho tro tren backend hien tai.',
    };
  }

  /// Create payment for Momo
  /// Returns payment URL to redirect user
  Future<Map<String, dynamic>> createMomoPayment({
    required String orderId,
    required double amount,
    required String orderInfo,
  }) async {
    return {
      'success': false,
      'message': 'Momo hien khong duoc ho tro tren backend hien tai.',
    };
  }

  /// Create COD order
  /// No payment URL needed, just confirm order
  Future<Map<String, dynamic>> createCODOrder({
    required String orderId,
    required double amount,
    required String shippingAddress,
  }) async {
    return {
      'success': false,
      'message': 'Thanh toan COD duoc xu ly trong luong checkout moi.',
    };
  }

  /// Verify payment callback from VNPay/Momo
  /// Backend validates the signature and updates order status
  Future<Map<String, dynamic>> verifyPaymentCallback({
    required PaymentMethodType method,
    required Map<String, dynamic> params,
  }) async {
    return {
      'success': false,
      'message': 'Khong ho tro verify callback cho phuong thuc nay.',
    };
  }

  /// Get payment status
  Future<PaymentTransaction?> getPaymentStatus(String orderId) async {
    try {
      final response = await _client.get(
        ApiEndpoints.paymentByOrderId(orderId),
      );
      final data = response.data;
      if (data == null) return null;
      if (data is! Map) {
        return null;
      }

      return PaymentTransaction.fromJson(_asMap(data));
    } on DioException {
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Cancel payment
  Future<bool> cancelPayment(String orderId) async {
    return false;
  }

  /// Get payment history
  Future<List<PaymentTransaction>> getPaymentHistory() async {
    return const <PaymentTransaction>[];
  }

  List<PaymentMethod> _normalizeSingleDefault(List<PaymentMethod> methods) {
    if (methods.isEmpty) return methods;

    var hasDefault = false;
    return methods.map((method) {
      if (!method.isDefault) return method;
      if (hasDefault) return method.copyWith(isDefault: false);
      hasDefault = true;
      return method;
    }).toList();
  }

  List<dynamic> _asList(dynamic data) {
    if (data is List) return data;
    if (data is Map && data['data'] is List) {
      return data['data'] as List<dynamic>;
    }
    return const <dynamic>[];
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) {
      return data.map((k, v) => MapEntry(k.toString(), v));
    }
    return <String, dynamic>{};
  }

  String _messageFromDio(DioException error) {
    final data = error.response?.data;
    if (data is Map) {
      final message = data['message'];
      if (message is List && message.isNotEmpty) {
        return message.join(', ');
      }
      if (message is String && message.trim().isNotEmpty) {
        return message;
      }
    }

    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return 'Ket noi may chu qua lau. Vui long thu lai.';
    }

    return 'Khong the ket noi den he thong thanh toan.';
  }
}

class PaymentServiceException implements Exception {
  final String message;

  const PaymentServiceException(this.message);

  @override
  String toString() => message;
}

final paymentServiceProvider = Provider<PaymentService>((ref) {
  final client = ref.watch(apiClientProvider);
  return PaymentService(client: client);
});
