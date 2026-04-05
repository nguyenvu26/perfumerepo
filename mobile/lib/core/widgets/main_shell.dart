import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../features/home/presentation/home_screen.dart';
import '../../features/product/presentation/explore_screen.dart';
import '../../features/alerts/presentation/alerts_screen.dart';
import '../../features/consultation/presentation/consultation_screen.dart';
import '../../features/membership/presentation/profile_screen.dart';
import '../theme/app_theme.dart';
import 'luxury_drawer.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    ExploreScreen(),
    SizedBox.shrink(), // Placeholder for FAB (AI)
    AlertsScreen(),
    ProfileScreen(),
  ];

  void _openConsultation() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ConsultationScreen(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      drawer: const LuxuryDrawer(),

      // ================= BODY =================
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: IndexedStack(
          key: ValueKey(_selectedIndex),
          index: _selectedIndex,
          children: _screens,
        ),
      ),

      // ================= FAB (AI) =================
      floatingActionButton: Transform.translate(
        offset: const Offset(0, 10), // ↓ hạ nút AI
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 1.0, end: 1.05),
          duration: const Duration(seconds: 2),
          curve: Curves.easeInOut,
          builder: (context, scale, child) {
            return Transform.scale(scale: scale, child: child);
          },
          child: FloatingActionButton(
            backgroundColor: AppTheme.accentGold,
            elevation: 6,
            onPressed: _openConsultation,
            child: const Icon(
              Icons.auto_awesome_rounded,
              size: 26,
              color: AppTheme.primaryDb,
            ),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,

      // ================= BOTTOM NAV =================
      bottomNavigationBar: _LuxuryBottomNavBar(
        currentIndex: _selectedIndex,
        onChanged: (index) {
          if (index == 2) return; // FAB handles AI
          setState(() => _selectedIndex = index);
        },
      ),
    );
  }
}

// ============================================================================
// BOTTOM NAV BAR
// ============================================================================

class _LuxuryBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onChanged;

  const _LuxuryBottomNavBar({
    required this.currentIndex,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              Expanded(
                child: _NavBarItem(
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home_rounded,
                  label: 'Trang chủ',
                  isSelected: currentIndex == 0,
                  onTap: () => onChanged(0),
                ),
              ),
              Expanded(
                child: _NavBarItem(
                  icon: Icons.explore_outlined,
                  activeIcon: Icons.explore_rounded,
                  label: 'Khám phá',
                  isSelected: currentIndex == 1,
                  onTap: () => onChanged(1),
                ),
              ),

              // Space for FAB
              const SizedBox(width: 72),

              Expanded(
                child: _NavBarItem(
                  icon: Icons.notifications_outlined,
                  activeIcon: Icons.notifications_rounded,
                  label: 'Thông báo',
                  isSelected: currentIndex == 3,
                  onTap: () => onChanged(3),
                ),
              ),
              Expanded(
                child: _NavBarItem(
                  icon: Icons.person_outline_rounded,
                  activeIcon: Icons.person_rounded,
                  label: 'Hồ sơ',
                  isSelected: currentIndex == 4,
                  onTap: () => onChanged(4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// NAV BAR ITEM (ANIMATED)
// ============================================================================

class _NavBarItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedScale(
            scale: isSelected ? 1.15 : 1.0,
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            child: Icon(
              isSelected ? activeIcon : icon,
              size: 22,
              color: isSelected ? AppTheme.accentGold : AppTheme.mutedSilver,
            ),
          ),
          const SizedBox(height: 4),

          AnimatedOpacity(
            opacity: isSelected ? 1 : 0.6,
            duration: const Duration(milliseconds: 200),
            child: Text(
              label,
              style: GoogleFonts.montserrat(
                fontSize: 10,
                letterSpacing: 0.8,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? AppTheme.accentGold : AppTheme.mutedSilver,
              ),
            ),
          ),

          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(top: 4),
            width: isSelected ? 6 : 0,
            height: isSelected ? 6 : 0,
            decoration: const BoxDecoration(
              color: AppTheme.accentGold,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}
