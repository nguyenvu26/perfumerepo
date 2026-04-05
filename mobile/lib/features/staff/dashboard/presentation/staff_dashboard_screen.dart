import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../models/daily_report.dart';
import '../providers/dashboard_provider.dart';

class StaffDashboardScreen extends ConsumerWidget {
  const StaffDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(dashboardProvider);
    final currencyFmt = NumberFormat('#,###', 'vi_VN');

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: RefreshIndicator(
        color: AppTheme.accentGold,
        onRefresh: () => ref.read(dashboardProvider.notifier).loadReport(),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: _buildGradientHeader(context, ref, state),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                0,
                AppSpacing.md,
                AppSpacing.lg,
              ),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (state.isLoading && state.report == null) ...[
                    const ShimmerCard(height: 120),
                    AppSpacing.vertSm,
                    const Row(
                      children: [
                        Expanded(child: ShimmerCard(height: 80)),
                        SizedBox(width: AppSpacing.sm),
                        Expanded(child: ShimmerCard(height: 80)),
                        SizedBox(width: AppSpacing.sm),
                        Expanded(child: ShimmerCard(height: 80)),
                      ],
                    ),
                    AppSpacing.vertSm,
                    const ShimmerCard(height: 60),
                    AppSpacing.vertSm,
                    const ShimmerCard(height: 200),
                  ] else if (state.error != null && state.report == null)
                    _buildError(context, ref, state.error!)
                  else if (state.report != null) ...[
                    _buildKpiGrid(state.report!, currencyFmt),
                    AppSpacing.vertLg,
                    _buildQuickStats(state.report!),
                    AppSpacing.vertLg,
                    _buildTopProducts(state.report!, currencyFmt),
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Gradient Header ────────────────────────────────────────────

  Widget _buildGradientHeader(
    BuildContext context,
    WidgetRef ref,
    DashboardState state,
  ) {
    final dateFmt = DateFormat('dd/MM/yyyy');
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Chào buổi sáng'
        : hour < 18
        ? 'Chào buổi chiều'
        : 'Chào buổi tối';

    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        MediaQuery.of(context).padding.top + AppSpacing.xs,
        AppSpacing.md,
        AppSpacing.sm,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2C2C2C), Color(0xFF1A1A1A)],
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.accentGold,
                  AppTheme.accentGold.withValues(alpha: 0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(9),
            ),
            child: const Icon(
              Icons.dashboard_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          AppSpacing.horzSm,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  greeting,
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    color: Colors.white60,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  'Báo cáo bán hàng',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: AppRadius.buttonBorder,
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: state.selectedDate,
                  firstDate: DateTime(2024),
                  lastDate: DateTime.now(),
                  builder: (ctx, child) => Theme(
                    data: Theme.of(ctx).copyWith(
                      colorScheme: ColorScheme.light(
                        primary: AppTheme.accentGold,
                        onPrimary: Colors.white,
                        surface: AppTheme.creamWhite,
                      ),
                    ),
                    child: child!,
                  ),
                );
                if (picked != null) {
                  ref.read(dashboardProvider.notifier).changeDate(picked);
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: AppRadius.buttonBorder,
                  border: Border.all(color: Colors.white24),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.calendar_today_rounded,
                      size: 14,
                      color: AppTheme.accentGold,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      dateFmt.format(state.selectedDate),
                      style: GoogleFonts.montserrat(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Error ──────────────────────────────────────────────────────

  Widget _buildError(BuildContext context, WidgetRef ref, String error) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: AppRadius.cardBorder,
        border: Border.all(color: Colors.red.shade100),
      ),
      child: Column(
        children: [
          Icon(Icons.cloud_off_rounded, size: 48, color: Colors.red.shade300),
          AppSpacing.vertSm,
          Text(
            'Không thể tải dữ liệu',
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.red.shade700,
            ),
          ),
          AppSpacing.vertSm,
          OutlinedButton.icon(
            onPressed: () => ref.read(dashboardProvider.notifier).loadReport(),
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Thử lại'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red.shade600,
              side: BorderSide(color: Colors.red.shade300),
              shape: RoundedRectangleBorder(
                borderRadius: AppRadius.buttonBorder,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── KPI Grid ───────────────────────────────────────────────────

  Widget _buildKpiGrid(DailyReport report, NumberFormat currencyFmt) {
    return Column(
      children: [
        // Revenue hero card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF2C2C2C), Color(0xFF3D3D3D)],
            ),
            borderRadius: AppRadius.cardBorder,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.account_balance_wallet_rounded,
                      size: 20,
                      color: AppTheme.accentGold,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Tổng doanh thu',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      color: Colors.white60,
                    ),
                  ),
                ],
              ),
              AppSpacing.vertSm,
              Text(
                '${currencyFmt.format(report.totalRevenue)}đ',
                style: GoogleFonts.montserrat(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.accentGold,
                ),
              ),
            ],
          ),
        ),
        AppSpacing.vertSm,
        // 3 compact KPI cards
        Row(
          children: [
            Expanded(
              child: _kpiTile(
                Icons.receipt_long_rounded,
                'Tổng đơn',
                '${report.totalOrders}',
                Colors.blue,
              ),
            ),
            AppSpacing.horzSm,
            Expanded(
              child: _kpiTile(
                Icons.check_circle_rounded,
                'Đã TT',
                '${report.completedOrders}',
                Colors.green,
              ),
            ),
            AppSpacing.horzSm,
            Expanded(
              child: _kpiTile(
                Icons.trending_up_rounded,
                'TB/đơn',
                report.avgOrderValue > 0
                    ? '${currencyFmt.format(report.avgOrderValue)}đ'
                    : '0đ',
                Colors.purple,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _kpiTile(IconData icon, String label, String value, MaterialColor c) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: c.shade50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: c.shade600),
          ),
          AppSpacing.vertXs,
          Text(
            value,
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.deepCharcoal,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 10,
              color: AppTheme.mutedSilver,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // ── Quick Stats ────────────────────────────────────────────────

  Widget _buildQuickStats(DailyReport report) {
    final pending = report.totalOrders - report.completedOrders;
    final rate = report.totalOrders > 0
        ? ((report.completedOrders / report.totalOrders) * 100).round()
        : 0;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: AppRadius.cardBorder,
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            _quickCol('Chờ xử lý', '$pending', Colors.orange.shade600),
            _vDivider(),
            _quickCol('Tỷ lệ TT', '$rate%', Colors.green.shade600),
            _vDivider(),
            _quickCol(
              'Top SP',
              report.topProducts.isNotEmpty
                  ? '${report.topProducts.first.totalQuantity}'
                  : '0',
              AppTheme.accentGold,
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickCol(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.montserrat(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 10,
              color: AppTheme.mutedSilver,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _vDivider() => Container(
    width: 1,
    margin: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
    color: AppTheme.softTaupe,
  );

  // ── Top Products ───────────────────────────────────────────────

  Widget _buildTopProducts(DailyReport report, NumberFormat currencyFmt) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 20,
              decoration: BoxDecoration(
                color: AppTheme.accentGold,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Top sản phẩm bán chạy',
              style: GoogleFonts.playfairDisplay(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppTheme.deepCharcoal,
              ),
            ),
          ],
        ),
        AppSpacing.vertSm,
        if (report.topProducts.isEmpty)
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppTheme.creamWhite,
              borderRadius: AppRadius.cardBorder,
              border: Border.all(color: AppTheme.softTaupe),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.local_mall_outlined,
                    size: 40,
                    color: AppTheme.mutedSilver.withValues(alpha: 0.4),
                  ),
                  AppSpacing.vertXs,
                  Text(
                    'Chưa có đơn hàng nào',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ...List.generate(report.topProducts.length, (i) {
            final p = report.topProducts[i];
            const medals = [
              Color(0xFFD4AF37),
              Color(0xFFC0C0C0),
              Color(0xFFCD7F32),
            ];
            final medalColor = i < 3 ? medals[i] : AppTheme.softTaupe;

            return Container(
              margin: const EdgeInsets.only(bottom: AppSpacing.xs),
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppTheme.creamWhite,
                borderRadius: AppRadius.cardBorder,
                border: Border.all(
                  color: i == 0
                      ? AppTheme.accentGold.withValues(alpha: 0.3)
                      : AppTheme.softTaupe.withValues(alpha: 0.5),
                ),
                boxShadow: i == 0
                    ? [
                        BoxShadow(
                          color: AppTheme.accentGold.withValues(alpha: 0.08),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: i < 3
                          ? LinearGradient(
                              colors: [
                                medalColor,
                                medalColor.withValues(alpha: 0.7),
                              ],
                            )
                          : null,
                      color: i >= 3 ? AppTheme.softTaupe : null,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: i < 3
                        ? const Icon(
                            Icons.emoji_events_rounded,
                            size: 16,
                            color: Colors.white,
                          )
                        : Text(
                            '${i + 1}',
                            style: GoogleFonts.montserrat(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.deepCharcoal,
                            ),
                          ),
                  ),
                  AppSpacing.horzSm,
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p.productName,
                          style: GoogleFonts.montserrat(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.deepCharcoal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          p.variantName,
                          style: GoogleFonts.montserrat(
                            fontSize: 11,
                            color: AppTheme.mutedSilver,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.accentGold.withValues(alpha: 0.1),
                          borderRadius: AppRadius.chipBorder,
                        ),
                        child: Text(
                          'x${p.totalQuantity}',
                          style: GoogleFonts.montserrat(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.accentGold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${currencyFmt.format(p.totalRevenue)}đ',
                        style: GoogleFonts.montserrat(
                          fontSize: 11,
                          color: AppTheme.mutedSilver,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}
