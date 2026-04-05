import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../widgets/profile_action_tile.dart';

/// Account Actions Section
///
/// List of account-related navigation items.
///
/// Why this is a section:
/// - Groups all account actions in one place
/// - Makes it easy to reorder or add new actions
/// - Separates navigation from profile display
class AccountActionsSection extends StatelessWidget {
  final VoidCallback onMyOrders;
  final VoidCallback onShippingAddresses;
  final VoidCallback onAiPreferences;
  final VoidCallback? onPaymentMethods;
  final String? activeShipmentsText;

  const AccountActionsSection({
    super.key,
    required this.onMyOrders,
    required this.onShippingAddresses,
    required this.onAiPreferences,
    this.onPaymentMethods,
    this.activeShipmentsText,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 10),
            child: Text(
              'TÀI KHOẢN',
              style: GoogleFonts.montserrat(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.1,
                color: AppTheme.mutedSilver,
              ),
            ),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Column(
              children: [
                ProfileActionTile(
                  icon: Icons.shopping_bag_outlined,
                  title: 'Đơn hàng của tôi',
                  subtitle: activeShipmentsText,
                  subtitleIsBadge: activeShipmentsText != null,
                  onTap: onMyOrders,
                ),
                ProfileActionTile(
                  icon: Icons.local_shipping_outlined,
                  title: 'Địa chỉ giao hàng',
                  onTap: onShippingAddresses,
                ),
                ProfileActionTile(
                  icon: Icons.credit_card_outlined,
                  title: 'Phương thức thanh toán',
                  onTap: onPaymentMethods ?? () {},
                ),
                ProfileActionTile(
                  icon: Icons.tune_outlined,
                  title: 'Tùy chọn AI',
                  onTap: onAiPreferences,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Logout Section
class LogoutSection extends StatelessWidget {
  final VoidCallback onLogout;

  const LogoutSection({super.key, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onLogout,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.red.withValues(alpha: 0.15),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.logout_rounded,
                  size: 15,
                  color: Colors.red.shade400,
                ),
                const SizedBox(width: 8),
                Text(
                  'Đăng xuất',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.red.shade400,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
