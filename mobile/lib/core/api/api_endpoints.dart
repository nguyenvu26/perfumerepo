/// Centralized API endpoint constants.
///
/// All backend routes are defined here so they can be referenced
/// from any service without duplicating strings.
class ApiEndpoints {
  ApiEndpoints._();

  // ── Auth ──────────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/profile';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String changePassword = '/auth/change-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-verification';
  static const String socialLogin = '/auth/social-login';

  // ── Promotions ────────────────────────────────────────────────────
  static const String promotionsActive = '/promotions/active';
  static const String promotionsValidate = '/promotions/validate';

  // ── Products ──────────────────────────────────────────────────────
  static const String products = '/products';
  static String productById(String id) => '/products/$id';

  // ── Cart ──────────────────────────────────────────────────────────
  static const String cart = '/cart';
  static const String cartItems = '/cart/items';
  static String cartItem(int itemId) => '/cart/items/$itemId';

  // ── Orders ────────────────────────────────────────────────────────
  static const String orders = '/orders';
  static String orderById(String id) => '/orders/$id';
  static String shipmentsByOrderId(String orderId) =>
      '/shipping/orders/$orderId';

  // ── Addresses ─────────────────────────────────────────────────────
  static const String addresses = '/addresses';
  static String addressById(String id) => '/addresses/$id';
  static String addressDefault(String id) => '/addresses/$id/default';

  // ── GHN ───────────────────────────────────────────────────────────
  static const String ghnProvinces = '/ghn/provinces';
  static const String ghnDistricts = '/ghn/districts';
  static const String ghnWards = '/ghn/wards';
  static const String ghnServices = '/ghn/services';
  static const String ghnCalculateFee = '/ghn/calculate-fee';

  // ── Payments ──────────────────────────────────────────────────────
  static const String payments = '/payments';
  static const String createPayosPayment = '/payments/create-payment';
  static String paymentByOrderId(String orderId) => '/payments/order/$orderId';
  static const String paymentMethods = '/payment-methods';
  static String paymentMethodDefaultById(String id) =>
      '/payment-methods/$id/default';
  // Legacy (unused)
  static const String paymentVnpayCreate = '/payments/vnpay/create';
  static const String paymentMomoCreate = '/payments/momo/create';
  static const String paymentCodCreate = '/payments/cod/create';
  static const String paymentVnpayVerify = '/payments/vnpay/verify';
  static const String paymentMomoVerify = '/payments/momo/verify';

  // ── Catalog ───────────────────────────────────────────────────────
  static const String catalog = '/catalog';
  static const String categories = '/catalog/categories';
  static const String brands = '/catalog/brands';

  // ── Reviews ───────────────────────────────────────────────────────
  static const String createReview = '/reviews';
  static const String uploadReviewImages = '/reviews/upload-images';
  static String reviewsByProduct(String productId) =>
      '/reviews/product/$productId';
  static String reviewStatsByProduct(String productId) =>
      '/reviews/product/$productId/stats';
  static String reviewSummaryByProduct(String productId) =>
      '/reviews/product/$productId/summary';

  // ── Stores ────────────────────────────────────────────────────────
  static const String myStores = '/stores/my-stores';

  // ── Staff: Inventory ──────────────────────────────────────────────
  static const String staffInventory = '/staff/inventory';
  static const String staffInventoryImport = '/staff/inventory/import';
  static const String staffInventoryAdjust = '/staff/inventory/adjust';
  static const String staffInventoryRequests = '/staff/inventory/requests';
  static const String staffInventoryLogs = '/staff/inventory/logs';
  static const String staffInventorySearchProducts =
      '/staff/inventory/search-products';

  // ── Staff: Orders ─────────────────────────────────────────────────
  static const String staffOrders = '/staff/orders';
  static String staffOrderById(String id) => '/staff/orders/$id';

  // ── Staff: POS ────────────────────────────────────────────────────
  static const String staffPosProducts = '/staff/pos/products';
  static const String staffPosLoyalty = '/staff/pos/loyalty';
  static const String staffPosOrders = '/staff/pos/orders';
  static String staffPosOrderById(String id) => '/staff/pos/orders/$id';
  static String staffPosOrderCustomer(String id) =>
      '/staff/pos/orders/$id/customer';
  static String staffPosOrderItems(String id) => '/staff/pos/orders/$id/items';
  static String staffPosPayCash(String id) => '/staff/pos/orders/$id/pay/cash';
  static String staffPosPayQr(String id) => '/staff/pos/orders/$id/pay/qr';
  static String staffPosCancelOrder(String id) => '/staff/pos/orders/$id';
  static const String staffPosCheckout = '/staff/pos/checkout';
  static const String staffPosAiConsult = '/staff/pos/ai-consult';

  // ── Staff: Reports ────────────────────────────────────────────────
  static const String staffReportsDaily = '/staff/reports/daily';
}
