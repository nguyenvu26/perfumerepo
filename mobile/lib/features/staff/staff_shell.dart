import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_spacing.dart';
import 'dashboard/presentation/staff_dashboard_screen.dart';
import 'pos/presentation/staff_pos_screen.dart';
import 'inventory/presentation/staff_inventory_screen.dart';
import 'orders/presentation/staff_orders_screen.dart';
import 'profile/presentation/staff_profile_screen.dart';

/// Current tab index for StaffShell — accessible from any screen.
final staffTabIndexProvider = StateProvider<int>((ref) => 0);

class StaffShell extends ConsumerWidget {
  const StaffShell({super.key});

  static const List<Widget> _screens = [
    StaffDashboardScreen(),
    StaffPosScreen(),
    StaffInventoryScreen(),
    StaffOrdersScreen(),
    StaffProfileScreen(),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = ref.watch(staffTabIndexProvider);

    return Scaffold(
      body: IndexedStack(index: selectedIndex, children: _screens),
      bottomNavigationBar: _StaffBottomNavBar(
        currentIndex: selectedIndex,
        onChanged: (index) =>
            ref.read(staffTabIndexProvider.notifier).state = index,
      ),
    );
  }
}

// ============================================================================
// PREMIUM BOTTOM NAV BAR
// ============================================================================

class _StaffBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onChanged;

  const _StaffBottomNavBar({
    required this.currentIndex,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          child: SizedBox(
            height: 60,
            child: Row(
              children: [
                _StaffNavItem(
                  icon: Icons.dashboard_outlined,
                  activeIcon: Icons.dashboard_rounded,
                  label: 'Home',
                  isSelected: currentIndex == 0,
                  onTap: () => onChanged(0),
                ),
                _StaffNavItem(
                  icon: Icons.point_of_sale_outlined,
                  activeIcon: Icons.point_of_sale_rounded,
                  label: 'POS',
                  isSelected: currentIndex == 1,
                  onTap: () => onChanged(1),
                ),
                _StaffNavItem(
                  icon: Icons.inventory_2_outlined,
                  activeIcon: Icons.inventory_2_rounded,
                  label: 'Kho',
                  isSelected: currentIndex == 2,
                  onTap: () => onChanged(2),
                ),
                _StaffNavItem(
                  icon: Icons.receipt_long_outlined,
                  activeIcon: Icons.receipt_long_rounded,
                  label: 'Đơn hàng',
                  isSelected: currentIndex == 3,
                  onTap: () => onChanged(3),
                ),
                _StaffNavItem(
                  icon: Icons.person_outline_rounded,
                  activeIcon: Icons.person_rounded,
                  label: 'Cá nhân',
                  isSelected: currentIndex == 4,
                  onTap: () => onChanged(4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StaffNavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _StaffNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: isSelected
                ? AppTheme.accentGold.withValues(alpha: 0.15)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Icon(
                  isSelected ? activeIcon : icon,
                  key: ValueKey(isSelected),
                  size: 22,
                  color: isSelected ? AppTheme.accentGold : Colors.white38,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: GoogleFonts.montserrat(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  letterSpacing: 0.3,
                  color: isSelected ? AppTheme.accentGold : Colors.white38,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
