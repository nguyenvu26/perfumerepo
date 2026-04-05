import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/env.dart';
import '../storage/secure_token_storage.dart';
import 'interceptors.dart';

/// Centralized Dio-based HTTP client.
///
/// All API calls should go through this client so that authentication,
/// logging, and error handling are applied consistently.
class ApiClient {
  late final Dio dio;
  final SecureTokenStorage tokenStorage;

  ApiClient({required this.tokenStorage}) {
    dio = Dio(
      BaseOptions(
        baseUrl: EnvConfig.fullBaseUrl,
        connectTimeout: Duration(milliseconds: EnvConfig.connectTimeout),
        receiveTimeout: Duration(milliseconds: EnvConfig.receiveTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Order matters: auth first, then logger
    dio.interceptors.addAll([
      AuthInterceptor(tokenStorage: tokenStorage, dio: dio),
      createLogger(),
    ]);
  }

  // ── Convenience wrappers ──────────────────────────────────────────

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => dio.get<T>(path, queryParameters: queryParameters, options: options);

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => dio.post<T>(
    path,
    data: data,
    queryParameters: queryParameters,
    options: options,
  );

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => dio.put<T>(
    path,
    data: data,
    queryParameters: queryParameters,
    options: options,
  );

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => dio.patch<T>(
    path,
    data: data,
    queryParameters: queryParameters,
    options: options,
  );

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => dio.delete<T>(
    path,
    data: data,
    queryParameters: queryParameters,
    options: options,
  );
}

// ── Riverpod Providers ────────────────────────────────────────────────

/// Single instance of [SecureTokenStorage] available app-wide.
final secureTokenStorageProvider = Provider<SecureTokenStorage>((ref) {
  return SecureTokenStorage();
});

/// Single instance of [ApiClient] available app-wide.
final apiClientProvider = Provider<ApiClient>((ref) {
  final tokenStorage = ref.watch(secureTokenStorageProvider);
  return ApiClient(tokenStorage: tokenStorage);
});
