import 'dart:io';
import 'dart:async';
import 'package:dio/dio.dart';

/// Maps raw exceptions from the data layer into user-friendly Vietnamese
/// messages suitable for display in [AppErrorWidget].
class ApiErrorMapper {
  ApiErrorMapper._();

  static String toUserMessage(dynamic error) {
    if (error is DioException) {
      return _mapDioException(error);
    }
    if (error is SocketException) {
      return 'Không có kết nối mạng. Vui lòng kiểm tra lại.';
    }
    if (error is TimeoutException) {
      return 'Kết nối quá chậm. Vui lòng thử lại.';
    }
    return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }

  static String _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Kết nối quá chậm. Vui lòng thử lại.';

      case DioExceptionType.connectionError:
        return 'Không có kết nối mạng. Vui lòng kiểm tra lại.';

      case DioExceptionType.badResponse:
        return _mapStatusCode(e.response?.statusCode, e.response?.data);

      case DioExceptionType.cancel:
        return 'Yêu cầu đã bị huỷ.';

      default:
        return 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
  }

  static String _mapStatusCode(int? statusCode, dynamic data) {
    // Try to extract backend message first
    if (data is Map<String, dynamic>) {
      final msg = data['message'];
      if (msg is String && msg.isNotEmpty) return msg;
      if (msg is List && msg.isNotEmpty) return msg.first.toString();
    }

    switch (statusCode) {
      case 400:
        return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 404:
        return 'Không tìm thấy dữ liệu yêu cầu.';
      case 409:
        return 'Dữ liệu bị xung đột. Vui lòng làm mới và thử lại.';
      case 422:
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
      case 429:
        return 'Quá nhiều yêu cầu. Vui lòng chờ một chút rồi thử lại.';
      case 500:
      case 502:
      case 503:
        return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
      default:
        return 'Đã xảy ra lỗi (${statusCode ?? "unknown"}). Vui lòng thử lại.';
    }
  }
}
