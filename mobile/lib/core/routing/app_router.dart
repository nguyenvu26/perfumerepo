import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/onboarding/providers/onboarding_provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/checkout/presentation/checkout_screen.dart';
import '../../features/checkout/presentation/order_success_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/orders/presentation/order_detail_screen.dart';
import '../../features/orders/presentation/screens/track_order_screen.dart';
import '../../features/payment/presentation/payment_method_screen.dart';
import '../../features/payment/presentation/payment_result_screen.dart';
import '../../features/payment/presentation/screens/payment_method_screen.dart';
import '../../features/address/presentation/screens/address_management_screen.dart';
import '../../features/profile/presentation/screens/profile_edit_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../../features/wishlist/presentation/wishlist_screen.dart';
import '../../features/product/presentation/explore_screen.dart';
import '../../features/product/presentation/product_detail_screen.dart';
import '../../features/product/presentation/reviews_screen.dart';
import '../../features/loyalty/presentation/loyalty_screen.dart';
import '../../features/staff/staff_shell.dart';
import '../widgets/main_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final isLoggedIn = ref.watch(authStateProvider);
  final hasSeenOnboarding = ref.watch(onboardingProvider);
  final profile = ref.watch(userProfileRawProvider);
  final userRole = (profile?['role'] as String?)?.toUpperCase() ?? '';

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final isAuthRoute = loc == '/login' || loc == '/register';
      final isOnboardingRoute = loc == '/onboarding';
      final isStaffRoute = loc.startsWith('/staff');

      // 1. Force Onboarding if not seen
      if (!hasSeenOnboarding) {
        if (!isOnboardingRoute) return '/onboarding';
        return null;
      }

      // 2. If already saw onboarding but at onboarding route, move to login/home
      if (isOnboardingRoute) {
        if (!isLoggedIn) return '/login';
        return userRole == 'STAFF' ? '/staff/home' : '/home';
      }

      // 3. Force Login if not logged in and not on auth route
      if (!isLoggedIn && !isAuthRoute) {
        return '/login';
      }

      // 4. Force Home if logged in but on auth route
      if (isLoggedIn && isAuthRoute) {
        return userRole == 'STAFF' ? '/staff/home' : '/home';
      }

      // 5. Role-based routing: STAFF landing on customer home → redirect
      if (isLoggedIn && userRole == 'STAFF') {
        if (loc == '/' || loc == '/home') return '/staff/home';
      }

      // 6. Non-staff trying to access staff routes → redirect to home
      if (isLoggedIn &&
          userRole != 'STAFF' &&
          userRole != 'ADMIN' &&
          isStaffRoute) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const MainShell()),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(path: '/home', builder: (context, state) => const MainShell()),
      GoRoute(path: '/cart', builder: (context, state) => const CartScreen()),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/order-success',
        builder: (context, state) => const OrderSuccessScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (context, state) {
          final orderId = state.pathParameters['id']!;
          return OrderDetailScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/orders/:id/track',
        builder: (context, state) {
          final orderId = state.pathParameters['id']!;
          return TrackOrderScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/shipping-addresses',
        builder: (context, state) => const AddressManagementScreen(),
      ),
      GoRoute(
        path: '/profile-edit',
        builder: (context, state) => const ProfileEditScreen(),
      ),
      GoRoute(
        path: '/profile-payment-methods',
        builder: (context, state) => const PreferredPaymentMethodScreen(),
      ),
      GoRoute(
        path: '/payment',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return PaymentMethodScreen(
            orderId: extra['orderId'] as String,
            amount: extra['amount'] as double,
            orderInfo: extra['orderInfo'] as String,
            shippingAddress: extra['shippingAddress'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/payment/result',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return PaymentResultScreen(
            success: extra['success'] as bool,
            message: extra['message'] as String,
            orderId: extra['orderId'] as String,
          );
        },
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/wishlist',
        builder: (context, state) => const WishlistScreen(),
      ),
      GoRoute(
        path: '/explore',
        builder: (context, state) => const ExploreScreen(),
      ),
      GoRoute(
        path: '/product/:id',
        builder: (context, state) {
          final productId = state.pathParameters['id']!;
          return ProductDetailScreen(productId: productId);
        },
      ),
      GoRoute(
        path: '/product/:id/reviews',
        builder: (context, state) {
          final productId = state.pathParameters['id']!;
          final productName = state.uri.queryParameters['name'] ?? 'Product';
          return ReviewsScreen(productId: productId, productName: productName);
        },
      ),
      GoRoute(
        path: '/reviews',
        builder: (context, state) {
          final productId = state.uri.queryParameters['productId'] ?? '';
          final productName = state.uri.queryParameters['name'] ?? 'Product';
          return ReviewsScreen(productId: productId, productName: productName);
        },
      ),
      GoRoute(
        path: '/rewards',
        builder: (context, state) => const LoyaltyScreen(),
      ),

      // ── Staff Routes ────────────────────────────────────────────────
      GoRoute(
        path: '/staff/home',
        builder: (context, state) => const StaffShell(),
      ),
      GoRoute(
        path: '/staff/pos',
        builder: (context, state) => const StaffShell(),
      ),
      GoRoute(
        path: '/staff/inventory',
        builder: (context, state) => const StaffShell(),
      ),
      GoRoute(
        path: '/staff/orders',
        builder: (context, state) => const StaffShell(),
      ),
    ],
  );
});
