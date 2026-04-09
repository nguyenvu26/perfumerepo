/// Centralized Route Definitions
///
/// Single source of truth for all app routes.
/// Eliminates hardcoded route strings and ensures consistency.
class AppRoutes {
  // Private constructor to prevent instantiation
  AppRoutes._();

  // ============================================
  // AUTH ROUTES
  // ============================================
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';
  static const String verifyEmail = '/verify-email';

  // ============================================
  // MAIN NAVIGATION (Bottom Tabs)
  // ============================================
  static const String home = '/home';
  static const String explore = '/explore';
  static const String aiConsultation = '/consultation';
  static const String alerts = '/alerts';
  static const String profile = '/profile';

  // ============================================
  // PRODUCT ROUTES
  // ============================================
  static const String productDetail = '/product';
  static const String productStory = '/product/story';
  static const String reviews = '/reviews';
  static const String collection = '/collection';

  // ============================================
  // SHOPPING ROUTES
  // ============================================
  static const String cart = '/cart';
  static const String checkout = '/checkout';
  static const String orderSuccess = '/order-success';
  static const String wishlist = '/wishlist';

  // ============================================
  // ORDER ROUTES
  // ============================================
  static const String orders = '/orders';
  static const String orderDetail = '/orders/:id';
  static const String trackOrder = '/orders/:id/track';
  static const String returnOrder = '/orders/:id/return';

  // ============================================
  // SEARCH & DISCOVERY
  // ============================================
  static const String search = '/search';

  // ============================================
  // PAYMENT ROUTES
  // ============================================
  static const String paymentMethod = '/payment-method';
  static const String paymentResult = '/payment-result';

  // ============================================
  // PROFILE & SETTINGS
  // ============================================
  static const String shippingAddresses = '/shipping-addresses';
  static const String profilePaymentMethods = '/profile-payment-methods';
  static const String profileEdit = '/profile-edit';
  static const String rewards = '/rewards';
  static const String quiz = '/quiz';

  // ============================================
  // STAFF ROUTES
  // ============================================
  static const String staffHome = '/staff/home';
  static const String staffPos = '/staff/pos';
  static const String staffInventory = '/staff/inventory';
  static const String staffOrders = '/staff/orders';

  // ============================================
  // HELPER METHODS
  // ============================================

  /// Build product detail route with ID
  static String productDetailWithId(String productId) {
    return '/product/$productId';
  }

  /// Build order detail route with ID
  static String orderDetailWithId(String orderId) {
    return '/orders/$orderId';
  }

  /// Build order tracking route with ID
  static String trackOrderWithId(String orderId) {
    return '/orders/$orderId/track';
  }

  /// Build order return route with ID
  static String returnOrderWithId(String orderId) {
    return '/orders/$orderId/return';
  }

  /// Build product story route with ID
  static String productStoryWithId(String productId) {
    return '/product/story?id=$productId';
  }

  /// Build reviews route with product ID
  static String reviewsWithProductId(String productId, {String? productName}) {
    final encodedName = productName == null
        ? ''
        : '?name=${Uri.encodeComponent(productName)}';
    return '/product/$productId/reviews$encodedName';
  }
}
