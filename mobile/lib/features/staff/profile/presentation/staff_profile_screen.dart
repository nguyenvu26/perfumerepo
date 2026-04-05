import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../profile/providers/profile_provider.dart';
import '../../inventory/providers/inventory_provider.dart';

class StaffProfileScreen extends ConsumerWidget {
  const StaffProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);
    final profileRaw = ref.watch(userProfileRawProvider);
    final role = (profileRaw?['role'] as String?)?.toUpperCase() ?? 'STAFF';

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: profileAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.accentGold),
        ),
        error: (e, _) => Center(
          child: Text(
            'Lỗi tải thông tin',
            style: TextStyle(color: Colors.red.shade400),
          ),
        ),
        data: (profile) {
          if (profile == null) {
            return const Center(child: Text('Chưa đăng nhập'));
          }

          return ListView(
            padding: EdgeInsets.zero,
            children: [
              // ── Header with avatar ──
              _buildHeader(
                context,
                profile.name,
                profile.email,
                profile.avatarUrl,
                role,
              ),

              const SizedBox(height: AppSpacing.md),

              // ── Personal Info Section ──
              _buildSectionTitle('Thông tin cá nhân'),
              _buildInfoCard(context, [
                _InfoRow(
                  icon: Icons.person_outline_rounded,
                  label: 'Họ tên',
                  value: profile.name,
                ),
                _InfoRow(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: profile.email,
                ),
                _InfoRow(
                  icon: Icons.phone_outlined,
                  label: 'Số điện thoại',
                  value: profile.phone ?? 'Chưa cập nhật',
                ),
                _InfoRow(
                  icon: Icons.badge_outlined,
                  label: 'Vai trò',
                  value: role == 'ADMIN' ? 'Quản trị viên' : 'Nhân viên',
                ),
                _InfoRow(
                  icon: Icons.calendar_today_outlined,
                  label: 'Tham gia từ',
                  value: profile.memberSinceText,
                ),
              ]),

              const SizedBox(height: AppSpacing.md),

              // ── Store Assignment Section ──
              _buildSectionTitle('Cửa hàng phân công'),
              _buildStoreSection(ref),

              const SizedBox(height: AppSpacing.lg),

              // ── Logout Button ──
              _buildLogoutButton(context, ref),

              const SizedBox(height: 40),
            ],
          );
        },
      ),
    );
  }

  // ── Header ───────────────────────────────────────────────────────

  Widget _buildHeader(
    BuildContext context,
    String name,
    String email,
    String? avatarUrl,
    String role,
  ) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        MediaQuery.of(context).padding.top + AppSpacing.md,
        AppSpacing.md,
        AppSpacing.lg,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2C2C2C), Color(0xFF1A1A1A)],
        ),
      ),
      child: Column(
        children: [
          // Avatar
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.accentGold, width: 2.5),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.accentGold.withValues(alpha: 0.3),
                  blurRadius: 16,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: ClipOval(
              child: avatarUrl != null && avatarUrl.isNotEmpty
                  ? Image.network(
                      avatarUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildAvatarFallback(name),
                    )
                  : _buildAvatarFallback(name),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            name,
            style: GoogleFonts.playfairDisplay(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            email,
            style: GoogleFonts.montserrat(fontSize: 13, color: Colors.white60),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppTheme.accentGold.withValues(alpha: 0.4),
              ),
            ),
            child: Text(
              role == 'ADMIN' ? 'ADMIN' : 'STAFF',
              style: GoogleFonts.montserrat(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppTheme.accentGold,
                letterSpacing: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarFallback(String name) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'S';
    return Container(
      color: AppTheme.accentGold.withValues(alpha: 0.2),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: GoogleFonts.playfairDisplay(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: AppTheme.accentGold,
        ),
      ),
    );
  }

  // ── Section Title ────────────────────────────────────────────────

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Text(
        title,
        style: GoogleFonts.playfairDisplay(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppTheme.deepCharcoal,
        ),
      ),
    );
  }

  // ── Info Card ────────────────────────────────────────────────────

  Widget _buildInfoCard(BuildContext context, List<_InfoRow> rows) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.sm,
        AppSpacing.md,
        0,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.creamWhite,
          borderRadius: AppRadius.cardBorder,
          border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            for (int i = 0; i < rows.length; i++) ...[
              _buildInfoRow(rows[i]),
              if (i < rows.length - 1)
                Divider(
                  height: 1,
                  indent: 48,
                  color: AppTheme.softTaupe.withValues(alpha: 0.3),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(_InfoRow row) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 14,
      ),
      child: Row(
        children: [
          Icon(row.icon, size: 20, color: AppTheme.accentGold),
          const SizedBox(width: 12),
          SizedBox(
            width: 100,
            child: Text(
              row.label,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                color: AppTheme.mutedSilver,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              row.value,
              style: GoogleFonts.montserrat(
                fontSize: 13,
                color: AppTheme.deepCharcoal,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  // ── Store Section ────────────────────────────────────────────────

  Widget _buildStoreSection(WidgetRef ref) {
    final storesAsync = ref.watch(staffStoresProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.sm,
        AppSpacing.md,
        0,
      ),
      child: storesAsync.when(
        loading: () => Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppTheme.creamWhite,
            borderRadius: AppRadius.cardBorder,
            border: Border.all(
              color: AppTheme.softTaupe.withValues(alpha: 0.5),
            ),
          ),
          child: const Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppTheme.accentGold,
              ),
            ),
          ),
        ),
        error: (_, __) => Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppTheme.creamWhite,
            borderRadius: AppRadius.cardBorder,
          ),
          child: Text(
            'Không thể tải danh sách cửa hàng',
            style: GoogleFonts.montserrat(
              fontSize: 13,
              color: Colors.red.shade400,
            ),
          ),
        ),
        data: (stores) {
          if (stores.isEmpty) {
            return Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppTheme.creamWhite,
                borderRadius: AppRadius.cardBorder,
                border: Border.all(
                  color: AppTheme.softTaupe.withValues(alpha: 0.5),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.store_outlined,
                    size: 20,
                    color: AppTheme.mutedSilver,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Chưa được phân công cửa hàng',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                ],
              ),
            );
          }

          return Container(
            decoration: BoxDecoration(
              color: AppTheme.creamWhite,
              borderRadius: AppRadius.cardBorder,
              border: Border.all(
                color: AppTheme.softTaupe.withValues(alpha: 0.5),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                for (int i = 0; i < stores.length; i++) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.accentGold.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.store_rounded,
                            size: 18,
                            color: AppTheme.accentGold,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                stores[i].name,
                                style: GoogleFonts.montserrat(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.deepCharcoal,
                                ),
                              ),
                              if (stores[i].address != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  stores[i].address!,
                                  style: GoogleFonts.montserrat(
                                    fontSize: 11,
                                    color: AppTheme.mutedSilver,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (stores[i].code != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.softTaupe.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              stores[i].code!,
                              style: GoogleFonts.montserrat(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.mutedSilver,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (i < stores.length - 1)
                    Divider(
                      height: 1,
                      indent: 56,
                      color: AppTheme.softTaupe.withValues(alpha: 0.3),
                    ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  // ── Logout Button ────────────────────────────────────────────────

  Widget _buildLogoutButton(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.red.shade600,
            side: BorderSide(color: Colors.red.shade300),
            shape: RoundedRectangleBorder(borderRadius: AppRadius.buttonBorder),
          ),
          icon: const Icon(Icons.logout_rounded, size: 20),
          label: Text(
            'Đăng xuất',
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          onPressed: () => _confirmLogout(context, ref),
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Đăng xuất',
          style: GoogleFonts.playfairDisplay(
            fontWeight: FontWeight.w700,
            color: AppTheme.deepCharcoal,
          ),
        ),
        content: Text(
          'Bạn có chắc chắn muốn đăng xuất?',
          style: GoogleFonts.montserrat(
            fontSize: 14,
            color: AppTheme.mutedSilver,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              'Huỷ',
              style: GoogleFonts.montserrat(
                fontWeight: FontWeight.w500,
                color: AppTheme.mutedSilver,
              ),
            ),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            child: Text(
              'Đăng xuất',
              style: GoogleFonts.montserrat(
                fontWeight: FontWeight.w600,
                color: Colors.red.shade600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helper class ─────────────────────────────────────────────────

class _InfoRow {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });
}
