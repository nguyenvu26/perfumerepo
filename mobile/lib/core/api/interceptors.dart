import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../storage/secure_token_storage.dart';
import '../config/env.dart';
import 'api_endpoints.dart';

/// Attaches the stored JWT access token to every outgoing request
/// and handles automatic token refresh on 401 responses.
class AuthInterceptor extends Interceptor {
  final SecureTokenStorage _tokenStorage;
  final Dio _dio;

  AuthInterceptor({required SecureTokenStorage tokenStorage, required Dio dio})
    : _tokenStorage = tokenStorage,
      _dio = dio;

  // Auth routes không cần token — gắn token hết hạn vào sẽ gây 401
  static const _publicPaths = {
    ApiEndpoints.login,
    ApiEndpoints.register,
    ApiEndpoints.refreshToken,
  };

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!_publicPaths.contains(options.path)) {
      final token = await _tokenStorage.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Attempt token refresh
      final refreshed = await _tryRefreshToken();
      if (refreshed) {
        // Retry the original request with the new token
        try {
          final token = await _tokenStorage.getAccessToken();
          final opts = err.requestOptions;
          opts.headers['Authorization'] = 'Bearer $token';
          final response = await _dio.fetch(opts);
          return handler.resolve(response);
        } on DioException catch (retryErr) {
          return handler.next(retryErr);
        }
      } else {
        // Refresh failed → clear tokens (force re-login)
        await _tokenStorage.clearAll();
      }
    }
    handler.next(err);
  }

  /// Attempts to obtain a new access token using the stored refresh token.
  Future<bool> _tryRefreshToken() async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken == null) return false;

      // Use a separate Dio instance to avoid interceptor loops
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: EnvConfig.fullBaseUrl,
          connectTimeout: Duration(milliseconds: EnvConfig.connectTimeout),
          receiveTimeout: Duration(milliseconds: EnvConfig.receiveTimeout),
        ),
      );

      final response = await refreshDio.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        await _tokenStorage.saveTokens(
          accessToken: data['accessToken'] as String,
          refreshToken: data['refreshToken'] as String? ?? refreshToken,
        );
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}

/// Returns a pre-configured [PrettyDioLogger] for debug builds.
PrettyDioLogger createLogger() {
  return PrettyDioLogger(
    requestHeader: true,
    requestBody: true,
    responseBody: true,
    responseHeader: false,
    error: true,
    compact: true,
    enabled: kDebugMode,
  );
}
