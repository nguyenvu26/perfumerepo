import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../loyalty/services/loyalty_service.dart';
import '../../providers/profile_provider.dart';
import '../sections/profile_header_section.dart';
import '../sections/user_identity_section.dart';
import '../sections/olfactory_signature_section.dart';
import '../sections/account_actions_section.dart';

/// Profile Screen - Refactored
///
/// Architecture:
/// - Screen orchestrates layout and navigation only
/// - Presentation logic delegated to sections
/// - Reusable widgets for common patterns
/// - State-driven UI from profileProvider
///
/// Why this refactor improves maintainability:
/// 1. Single Responsibility: Each section manages its own UI
/// 2. Reusability: Widgets can be used across app
/// 3. Testability: Each component can be tested independently
/// 4. Scalability: Adding new sections is trivial
/// 5. Readability: Screen file is <150 lines, easy to understand
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: SafeArea(
        child: profileAsync.when(
          data: (profile) {
            if (profile == null) {
              return _buildLoginRequired(context);
            }

            return ListView(
              padding: EdgeInsets.zero,
              children: [
                // Header (now scrollable)
                ProfileHeaderSection(
                  onBack: () => _handleBack(context),
                  onEdit: () => _handleEdit(context, ref),
                ),

                // User identity
                UserIdentitySection(profile: profile),

                // Loyalty CTA
                _LoyaltyCta(onTap: () => _handleLoyalty(context)),

                // AI Olfactory Signature
                if (profile.hasAiProfile)
                  OlfactorySignatureSection(
                    olfactoryTags: profile.olfactoryTags,
                    onFindNextScent: () => _handleFindNextScent(context, ref),
                    onViewScentProfile: () =>
                        _handleViewScentProfile(context, ref),
                  ),

                // Account actions
                AccountActionsSection(
                  onMyOrders: () => _handleMyOrders(context),
                  onShippingAddresses: () => _handleShippingAddresses(context),
                  onPaymentMethods: () => _handlePaymentMethods(context),
                  onAiPreferences: () => _handleAiPreferences(context),
                  activeShipmentsText: '2 đang giao',
                ),

                // Logout
                LogoutSection(onLogout: () => _handleLogout(context, ref)),

                // Bottom spacing for nav bar
                const SizedBox(height: 100),
              ],
            );
          },
          loading: () => _buildLoading(),
          error: (error, stack) => _buildError(error),
        ),
      ),
    );
  }

  // ============================================
  // Navigation Handlers
  // ============================================
  // All navigation is centralized here, making it easy to:
  // - Track navigation analytics
  // - Add navigation guards
  // - Implement deep linking
  // - Test navigation flows

  void _handleBack(BuildContext context) {
    // Guard against popping root route (from bottom navigation)
    // If this is a root route, back button should do nothing or navigate to home
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
    // If it's a root route (can't pop), do nothing - user uses bottom nav instead
  }

  void _handleEdit(BuildContext context, WidgetRef ref) {
    context.push(AppRoutes.profileEdit);
  }

  void _handleFindNextScent(BuildContext context, WidgetRef ref) {
    // Navigate to AI consultation using GoRouter
    context.push(AppRoutes.aiConsultation);
  }

  void _handleViewScentProfile(BuildContext context, WidgetRef ref) {
    // TODO: Navigate to full scent profile screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Hồ sơ mùi hương chi tiết sẽ sớm có mặt')),
    );
  }

  void _handleMyOrders(BuildContext context) {
    // Navigate to orders using GoRouter
    context.push(AppRoutes.orders);
  }

  void _handleLoyalty(BuildContext context) {
    context.push(AppRoutes.rewards);
  }

  void _handleShippingAddresses(BuildContext context) {
    context.push(AppRoutes.shippingAddresses);
  }

  void _handlePaymentMethods(BuildContext context) {
    context.push(AppRoutes.profilePaymentMethods);
  }

  void _handleAiPreferences(BuildContext context) {
    // TODO: Navigate to AI preferences screen
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Tùy chọn AI sẽ sớm có mặt')));
  }

  Future<void> _handleLogout(BuildContext context, WidgetRef ref) async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc muốn đăng xuất không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await ref.read(authControllerProvider.notifier).logout();
      if (context.mounted) {
        context.go('/login');
      }
    }
  }

  // ============================================
  // State UI Builders
  // ============================================

  Widget _buildLoginRequired(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person_outline, size: 64, color: AppTheme.mutedSilver),
          const SizedBox(height: 16),
          Text(
            'Vui lòng đăng nhập để xem hồ sơ của bạn',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/login'),
            child: const Text('Đăng nhập'),
          ),
        ],
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: CircularProgressIndicator(
        color: AppTheme.accentGold,
        strokeWidth: 2,
      ),
    );
  }

  Widget _buildError(Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: AppTheme.mutedSilver),
          const SizedBox(height: 16),
          Text('Lỗi khi tải hồ sơ: $error'),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Loyalty CTA Banner
// ──────────────────────────────────────────────

class _LoyaltyCta extends ConsumerWidget {
  final VoidCallback onTap;

  const _LoyaltyCta({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(loyaltyStatusProvider);

    final points = statusAsync.whenOrNull(data: (s) => s.points) ?? 0;
    final tier = statusAsync.whenOrNull(data: (s) => s.tierName) ?? '';

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.deepCharcoal,
                AppTheme.deepCharcoal.withValues(alpha: 0.88),
              ],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppTheme.deepCharcoal.withValues(alpha: 0.15),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.accentGold.withValues(alpha: 0.15),
                  border: Border.all(
                    color: AppTheme.accentGold.withValues(alpha: 0.4),
                    width: 1.5,
                  ),
                ),
                child: Icon(
                  Icons.workspace_premium_rounded,
                  size: 20,
                  color: AppTheme.accentGold,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Khách hàng thân thiết',
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    statusAsync.isLoading
                        ? Text(
                            'Đang tải...',
                            style: TextStyle(
                              fontFamily: 'Montserrat',
                              fontSize: 11,
                              color: Colors.white.withValues(alpha: 0.5),
                            ),
                          )
                        : Text(
                            points > 0
                                ? '$points điểm  •  Hạng $tier'
                                : 'Bắt đầu tích điểm ngay',
                            style: TextStyle(
                              fontFamily: 'Montserrat',
                              fontSize: 11,
                              color: AppTheme.accentGold.withValues(
                                alpha: 0.85,
                              ),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: Colors.white.withValues(alpha: 0.4),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
