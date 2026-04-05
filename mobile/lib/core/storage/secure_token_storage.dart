import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure token storage backed by flutter_secure_storage.
///
/// Stores the JWT access & refresh tokens encrypted on-device.
class SecureTokenStorage {
  final FlutterSecureStorage _storage;

  SecureTokenStorage({FlutterSecureStorage? storage})
    : _storage =
          storage ??
          const FlutterSecureStorage(
            aOptions: AndroidOptions(encryptedSharedPreferences: true),
          );

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  // ── Access Token ──────────────────────────────────────────────────

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);

  Future<void> saveAccessToken(String token) =>
      _storage.write(key: _accessTokenKey, value: token);

  Future<void> deleteAccessToken() => _storage.delete(key: _accessTokenKey);

  // ── Refresh Token ─────────────────────────────────────────────────

  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> saveRefreshToken(String token) =>
      _storage.write(key: _refreshTokenKey, value: token);

  Future<void> deleteRefreshToken() => _storage.delete(key: _refreshTokenKey);

  // ── Helpers ───────────────────────────────────────────────────────

  /// Persist both tokens at once after login / refresh.
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      saveAccessToken(accessToken),
      saveRefreshToken(refreshToken),
    ]);
  }

  /// Clear all auth-related data (logout).
  Future<void> clearAll() async {
    await Future.wait([deleteAccessToken(), deleteRefreshToken()]);
  }
}
