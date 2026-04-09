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

  /// POST /auth/forgot-password
  Future<Map<String, dynamic>> forgotPassword({required String email}) async {
    final response = await _client.post(
      ApiEndpoints.forgotPassword,
      data: {'email': email},
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST /auth/reset-password
  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final response = await _client.post(
      ApiEndpoints.resetPassword,
      data: {'token': token, 'newPassword': newPassword},
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST /auth/change-password (JWT required)
  Future<Map<String, dynamic>> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    final response = await _client.post(
      ApiEndpoints.changePassword,
      data: {'oldPassword': oldPassword, 'newPassword': newPassword},
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST /auth/verify-email
  Future<Map<String, dynamic>> verifyEmail({required String token}) async {
    final response = await _client.post(
      ApiEndpoints.verifyEmail,
      data: {'token': token},
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST /auth/resend-verification (JWT required)
  Future<Map<String, dynamic>> resendVerification() async {
    final response = await _client.post(ApiEndpoints.resendVerification);
    return response.data as Map<String, dynamic>;
  }

  /// POST /auth/social-login
  Future<Map<String, dynamic>> socialLogin({
    required String provider,
    required String token,
    required String email,
    required String providerId,
    String? fullName,
    String? avatarUrl,
  }) async {
    final response = await _client.post(
      ApiEndpoints.socialLogin,
      data: {
        'provider': provider,
        'token': token,
        'email': email,
        'providerId': providerId,
        if (fullName != null) 'fullName': fullName,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  /// GET /promotions/active (JWT required)
  Future<List<dynamic>> getActivePromotions() async {
    final response = await _client.get(ApiEndpoints.promotionsActive);
    return response.data as List<dynamic>;
  }

  /// POST /promotions/validate (JWT required)
  Future<Map<String, dynamic>> validatePromoCode({
    required String code,
    required int amount,
  }) async {
    final response = await _client.post(
      ApiEndpoints.promotionsValidate,
      data: {'code': code, 'amount': amount},
    );
    return response.data as Map<String, dynamic>;
  }
}
