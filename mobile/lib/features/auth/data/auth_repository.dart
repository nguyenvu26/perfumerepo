import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/storage/secure_token_storage.dart';
import 'auth_api_service.dart';

/// Repository that coordinates authentication operations.
///
/// Combines [AuthApiService] (network) with [SecureTokenStorage] (local)
/// to provide a single, clean API for the presentation layer.
class AuthRepository {
  final AuthApiService _apiService;
  final SecureTokenStorage _tokenStorage;

  AuthRepository({
    required AuthApiService apiService,
    required SecureTokenStorage tokenStorage,
  }) : _apiService = apiService,
       _tokenStorage = tokenStorage;

  Map<String, dynamic> _normalize(Map<String, dynamic> response) {
    final data = response['data'];
    if (data is Map<String, dynamic>) return data;
    return response;
  }

  String? _readString(Map<String, dynamic> source, List<String> keys) {
    for (final key in keys) {
      final value = source[key];
      if (value is String && value.isNotEmpty) return value;
    }
    return null;
  }

  /// Authenticate the user and persist tokens locally.
  ///
  /// Returns the decoded user profile from the login response.
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final raw = await _apiService.login(email: email, password: password);
    final data = _normalize(raw);

    final accessToken =
        _readString(data, ['accessToken', 'access_token']) ??
        _readString(raw, ['accessToken', 'access_token']);
    final refreshToken =
        _readString(data, ['refreshToken', 'refresh_token']) ??
        _readString(raw, ['refreshToken', 'refresh_token']);

    if (accessToken == null || refreshToken == null) {
      throw Exception('Login response missing accessToken/refreshToken.');
    }

    await _tokenStorage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    return data['user'] as Map<String, dynamic>? ??
        raw['user'] as Map<String, dynamic>? ??
        data;
  }

  /// Register a new account, persist tokens, and return user data.
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    final raw = await _apiService.register(
      email: email,
      password: password,
      fullName: fullName,
      phone: phone,
    );

    final data = _normalize(raw);
    final accessToken =
        _readString(data, ['accessToken', 'access_token']) ??
        _readString(raw, ['accessToken', 'access_token']);
    final refreshToken =
        _readString(data, ['refreshToken', 'refresh_token']) ??
        _readString(raw, ['refreshToken', 'refresh_token']);

    if (accessToken != null && refreshToken != null) {
      await _tokenStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
    }

    return data['user'] as Map<String, dynamic>? ??
        raw['user'] as Map<String, dynamic>? ??
        data;
  }

  /// Fetch the authenticated user's profile from the backend.
  Future<Map<String, dynamic>> getProfile() async {
    final raw = await _apiService.getProfile();
    return _normalize(raw);
  }

  /// Clear tokens and notify the backend.
  Future<void> logout() async {
    await _apiService.logout();
    await _tokenStorage.clearAll();
  }

  /// Whether there is a stored access token (offline check).
  Future<bool> get isAuthenticated async {
    final token = await _tokenStorage.getAccessToken();
    return token != null;
  }

  /// Send forgot-password email.
  Future<Map<String, dynamic>> forgotPassword({required String email}) {
    return _apiService.forgotPassword(email: email);
  }

  /// Reset password with token from email.
  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) {
    return _apiService.resetPassword(token: token, newPassword: newPassword);
  }

  /// Change password for authenticated user.
  Future<Map<String, dynamic>> changePassword({
    required String oldPassword,
    required String newPassword,
  }) {
    return _apiService.changePassword(
      oldPassword: oldPassword,
      newPassword: newPassword,
    );
  }

  /// Verify email with token from email link.
  Future<Map<String, dynamic>> verifyEmail({required String token}) {
    return _apiService.verifyEmail(token: token);
  }

  /// Resend verification email (authenticated).
  Future<Map<String, dynamic>> resendVerification() {
    return _apiService.resendVerification();
  }

  /// Social login via provider SDK token. Saves tokens on success.
  Future<Map<String, dynamic>> socialLogin({
    required String provider,
    required String token,
    required String email,
    required String providerId,
    String? fullName,
    String? avatarUrl,
  }) async {
    final raw = await _apiService.socialLogin(
      provider: provider,
      token: token,
      email: email,
      providerId: providerId,
      fullName: fullName,
      avatarUrl: avatarUrl,
    );
    final data = _normalize(raw);

    final accessToken =
        _readString(data, ['accessToken', 'access_token']) ??
        _readString(raw, ['accessToken', 'access_token']);
    final refreshToken =
        _readString(data, ['refreshToken', 'refresh_token']) ??
        _readString(raw, ['refreshToken', 'refresh_token']);

    if (accessToken == null || refreshToken == null) {
      throw Exception('Social login response missing tokens.');
    }

    await _tokenStorage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    return data['user'] as Map<String, dynamic>? ??
        raw['user'] as Map<String, dynamic>? ??
        data;
  }

  /// Fetch active promotions.
  Future<List<dynamic>> getActivePromotions() {
    return _apiService.getActivePromotions();
  }

  /// Validate a promo code against order amount.
  Future<Map<String, dynamic>> validatePromoCode({
    required String code,
    required int amount,
  }) {
    return _apiService.validatePromoCode(code: code, amount: amount);
  }
}

// ── Riverpod Providers ────────────────────────────────────────────────

final authApiServiceProvider = Provider<AuthApiService>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthApiService(client: client);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    apiService: ref.watch(authApiServiceProvider),
    tokenStorage: ref.watch(secureTokenStorageProvider),
  );
});
