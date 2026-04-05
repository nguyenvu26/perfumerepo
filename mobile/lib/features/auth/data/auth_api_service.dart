import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

/// Low-level API service for authentication endpoints.
///
/// Talks directly to the NestJS backend. Does NOT store tokens —
/// that responsibility belongs to [AuthRepository].
class AuthApiService {
  final ApiClient _client;

  AuthApiService({required ApiClient client}) : _client = client;

  /// POST /auth/login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      ApiEndpoints.login,
      data: {'email': email, 'password': password},
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST /auth/register
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    final response = await _client.post(
      ApiEndpoints.register,
      data: {
        'email': email,
        'password': password,
        'fullName': fullName,
        if (phone != null) 'phone': phone,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  /// GET /auth/profile
  Future<Map<String, dynamic>> getProfile() async {
    final response = await _client.get(ApiEndpoints.profile);
    return response.data as Map<String, dynamic>;
  }

  /// POST /auth/refresh
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _client.post(
      ApiEndpoints.refreshToken,
      data: {'refreshToken': refreshToken},
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST /auth/logout
  Future<void> logout() async {
    try {
      await _client.post(ApiEndpoints.logout);
    } on DioException {
      // Swallow – we clear local tokens regardless
    }
  }
}
