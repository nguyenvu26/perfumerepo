/// App Configuration
///
/// Chứa các cấu hình môi trường và feature flags.
/// Gộp cả dev-bypass lẫn mock-data flags.
class AppConfig {
  // ── Development Mode ──────────────────────────────────────────────
  /// Master flag – bật để sử dụng mock data và bypass authentication
  static const bool isDevelopmentMode = true;

  // ── Authentication ────────────────────────────────────────────────
  /// Sử dụng mock auth provider thay vì Supabase Auth
  static const bool useMockAuth = true;

  /// Bypass hoàn toàn auth guard trong router
  /// (cho phép vào mọi màn mà không cần đăng nhập)
  static const bool bypassAuth = true;

  // ── Onboarding ────────────────────────────────────────────────────
  /// Bỏ qua màn onboarding khi phát triển UI
  static const bool skipOnboarding = true;

  // ── Mock Data ─────────────────────────────────────────────────────
  /// Sử dụng mock order data thay vì Supabase
  static const bool useMockOrders = true;

  /// Mock user cho development (khi bypassAuth / useMockAuth = true)
  static const mockUser = {
    'id': 'dev-user-123',
    'email': 'dev@example.com',
    'fullName': 'Developer User',
    'role': 'CUSTOMER',
  };

  // ── API ───────────────────────────────────────────────────────────
  static const bool useRealAPI = true;

  // ── Logging ───────────────────────────────────────────────────────
  static const bool enableDebugLogs = true;
}
