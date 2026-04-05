import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';

// ─── Menu item config ────────────────────────────────────────────────────────

class _MenuItem {
  final IconData icon;
  final String label;
  final String? route;
  final bool isDestructive;

  const _MenuItem({
    required this.icon,
    required this.label,
    this.route,
    this.isDestructive = false,
  });
}

const _primaryItems = [
  _MenuItem(icon: Icons.spa_outlined, label: 'Hồ sơ mùi hương'),
  _MenuItem(
    icon: Icons.local_florist_outlined,
    label: 'Thư viện nước hoa',
    route: '/explore',
  ),
  _MenuItem(icon: Icons.diamond_outlined, label: 'Bộ sưu tập độc quyền'),
];

const _secondaryItems = [
  _MenuItem(icon: Icons.book_outlined, label: 'Nhật ký mùi hương'),
  _MenuItem(icon: Icons.support_agent_outlined, label: 'Hỗ trợ tư vấn'),
];

const _utilityItems = [
  _MenuItem(icon: Icons.settings_outlined, label: 'Cài đặt'),
  _MenuItem(
    icon: Icons.logout_rounded,
    label: 'Đăng xuất',
    isDestructive: true,
  ),
];

// ─── Luxury Drawer ───────────────────────────────────────────────────────────

class LuxuryDrawer extends ConsumerWidget {
  const LuxuryDrawer({super.key});

  void _onItemTap(BuildContext context, WidgetRef ref, _MenuItem item) {
    if (item.isDestructive) {
      ref.read(authControllerProvider.notifier).logout();
      if (context.mounted) context.go('/login');
      return;
    }
    Navigator.of(context).pop();
    if (item.route != null) context.push(item.route!);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfile = ref.watch(userProfileProvider);

    return Drawer(
      backgroundColor: AppTheme.creamWhite,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // ─── Search ──────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: GestureDetector(
                onTap: () {
                  Navigator.of(context).pop();
                  context.push('/search');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 11,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.softTaupe.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(32),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.search_rounded,
                        color: AppTheme.mutedSilver.withValues(alpha: 0.55),
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Tìm kiếm mùi hương...',
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                          color: AppTheme.mutedSilver.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 28),

            // ─── Profile ─────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: userProfile.when(
                data: (profile) => _UserProfileHeader(profile: profile),
                loading: () => const _UserProfileHeaderPlaceholder(),
                error: (_, __) => const _UserProfileHeader(profile: null),
              ),
            ),

            const SizedBox(height: 28),

            // ─── Menu (scrollable) ───────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Primary discovery
                    for (final item in _primaryItems)
                      _DrawerMenuTile(
                        item: item,
                        onTap: () => _onItemTap(context, ref, item),
                      ),

                    const SizedBox(height: 6),

                    // Secondary
                    for (final item in _secondaryItems)
                      _DrawerMenuTile(
                        item: item,
                        onTap: () => _onItemTap(context, ref, item),
                      ),

                    // Separator
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 10,
                      ),
                      child: Divider(
                        color: AppTheme.softTaupe.withValues(alpha: 0.5),
                        height: 1,
                        thickness: 0.5,
                      ),
                    ),

                    // Utility
                    for (final item in _utilityItems)
                      _DrawerMenuTile(
                        item: item,
                        onTap: () => _onItemTap(context, ref, item),
                      ),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),

            // ─── Footer ──────────────────────────────────────
            Column(
              children: [
                Divider(
                  color: AppTheme.softTaupe.withValues(alpha: 0.35),
                  height: 1,
                  thickness: 0.5,
                  indent: 40,
                  endIndent: 40,
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 12, bottom: 14),
                  child: Text(
                    'PerfumeGPT',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                      letterSpacing: 2.5,
                      color: AppTheme.mutedSilver.withValues(alpha: 0.4),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── User Profile Header ─────────────────────────────────────────────────────

class _UserProfileHeader extends StatelessWidget {
  final Map<String, dynamic>? profile;
  const _UserProfileHeader({required this.profile});

  String _getInitials(String? fullName) {
    if (fullName == null || fullName.trim().isEmpty) return 'U';
    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final nameValue =
        profile?['full_name'] ?? profile?['fullName'] ?? profile?['name'];
    final name = nameValue is String && nameValue.trim().isNotEmpty
        ? nameValue.trim()
        : 'Khách';

    final avatarValue = profile?['avatar_url'] ?? profile?['avatarUrl'];
    final avatarUrl = avatarValue is String && avatarValue.trim().isNotEmpty
        ? avatarValue.trim()
        : null;

    final initials = _getInitials(name);
    final loyaltyValue =
        profile?['loyalty_points'] ?? profile?['loyaltyPoints'];
    final loyaltyPoints = loyaltyValue is int
        ? loyaltyValue
        : loyaltyValue is num
        ? loyaltyValue.toInt()
        : 0;

    String tierLabel;
    if (loyaltyPoints >= 5000) {
      tierLabel = 'THÀNH VIÊN BẠCH KIM';
    } else if (loyaltyPoints >= 1000) {
      tierLabel = 'THÀNH VIÊN VÀNG';
    } else if (loyaltyPoints >= 300) {
      tierLabel = 'THÀNH VIÊN BẠC';
    } else {
      tierLabel = 'THÀNH VIÊN';
    }

    return Column(
      children: [
        // Avatar
        Container(
          width: 76,
          height: 76,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: AppTheme.champagneGold.withValues(alpha: 0.6),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.champagneGold.withValues(alpha: 0.12),
                blurRadius: 16,
                spreadRadius: 2,
              ),
            ],
          ),
          child: CircleAvatar(
            radius: 36,
            backgroundColor: AppTheme.softTaupe.withValues(alpha: 0.5),
            backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
            child: avatarUrl == null
                ? Text(
                    initials,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 26,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.accentGold,
                    ),
                  )
                : null,
          ),
        ),

        const SizedBox(height: 14),

        // Name
        Text(
          name,
          style: GoogleFonts.playfairDisplay(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: AppTheme.deepCharcoal,
            height: 1.2,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 8),

        // Membership badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: AppTheme.champagneGold.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppTheme.champagneGold.withValues(alpha: 0.25),
              width: 0.5,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.star_rounded,
                size: 12,
                color: AppTheme.accentGold.withValues(alpha: 0.8),
              ),
              const SizedBox(width: 5),
              Text(
                tierLabel,
                style: GoogleFonts.montserrat(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.8,
                  color: AppTheme.accentGold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── User Profile Placeholder ────────────────────────────────────────────────

class _UserProfileHeaderPlaceholder extends StatelessWidget {
  const _UserProfileHeaderPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 76,
          height: 76,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppTheme.softTaupe.withValues(alpha: 0.35),
            border: Border.all(
              color: AppTheme.champagneGold.withValues(alpha: 0.2),
              width: 1,
            ),
          ),
        ),
        const SizedBox(height: 14),
        Container(
          width: 110,
          height: 14,
          decoration: BoxDecoration(
            color: AppTheme.softTaupe.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(7),
          ),
        ),
        const SizedBox(height: 10),
        Container(
          width: 80,
          height: 10,
          decoration: BoxDecoration(
            color: AppTheme.softTaupe.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(5),
          ),
        ),
      ],
    );
  }
}

// ─── Drawer Menu Tile (with micro-interaction) ───────────────────────────────

class _DrawerMenuTile extends StatefulWidget {
  final _MenuItem item;
  final VoidCallback onTap;

  const _DrawerMenuTile({required this.item, required this.onTap});

  @override
  State<_DrawerMenuTile> createState() => _DrawerMenuTileState();
}

class _DrawerMenuTileState extends State<_DrawerMenuTile>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;
  late final Animation<double> _iconTint;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      reverseDuration: const Duration(milliseconds: 180),
    );
    _scale = Tween(
      begin: 1.0,
      end: 0.975,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _iconTint = Tween(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) => _controller.forward();
  void _handleTapUp(TapUpDetails _) {
    _controller.reverse();
    widget.onTap();
  }

  void _handleTapCancel() => _controller.reverse();

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final iconColor = Color.lerp(
          AppTheme.mutedSilver,
          AppTheme.accentGold,
          _iconTint.value,
        )!;
        final textColor = Color.lerp(
          AppTheme.deepCharcoal,
          AppTheme.deepCharcoal.withValues(alpha: 0.75),
          _iconTint.value,
        )!;

        return Transform.scale(
          scale: _scale.value,
          child: GestureDetector(
            onTapDown: _handleTapDown,
            onTapUp: _handleTapUp,
            onTapCancel: _handleTapCancel,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              child: Row(
                children: [
                  Icon(widget.item.icon, color: iconColor, size: 21),
                  const SizedBox(width: 16),
                  Text(
                    widget.item.label,
                    style: GoogleFonts.montserrat(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      letterSpacing: 0.3,
                      height: 1.35,
                      color: textColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
