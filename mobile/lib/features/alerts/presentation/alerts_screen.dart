import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/routing/app_routes.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_async_widget.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../models/alert.dart';
import '../providers/alerts_provider.dart';

class AlertsScreen extends ConsumerWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(alertsPrefsProvider);
    final alertsAsync = ref.watch(alertsProvider);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(alertsProvider.notifier).refresh(),
          color: AppTheme.accentGold,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              //  Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'TRUNG TÂM THÔNG BÁO',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 2.2,
                                    color: AppTheme.mutedSilver,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Thông báo của bạn',
                                  style: GoogleFonts.playfairDisplay(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.deepCharcoal,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          _MarkAllReadButton(alertsAsync: alertsAsync),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Theo dõi đơn hàng, ưu đãi riêng và hoạt động tài khoản.',
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          height: 1.6,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.deepCharcoal.withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(height: 18),
                      _AlertsHeroCard(alertsAsync: alertsAsync),
                      const SizedBox(height: 18),
                      _NotificationPreferencesCard(prefs: prefs),
                      const SizedBox(height: 18),
                      _FilterChipsRow(
                        activeFilter: prefs.activeFilter,
                        unreadCount:
                            alertsAsync.value
                                ?.where((a) => a.isUnread)
                                .length ??
                            0,
                      ),
                      const SizedBox(height: 18),
                    ],
                  ),
                ),
              ),

              //  Alerts body via AppAsyncWidget
              SliverToBoxAdapter(
                child: AppAsyncWidget<List<Alert>>(
                  value: alertsAsync,
                  onRetry: () => ref.invalidate(alertsProvider),
                  loadingBuilder: () => Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                    child: Column(
                      children: List.generate(
                        4,
                        (_) => const Padding(
                          padding: EdgeInsets.only(bottom: 12),
                          child: ShimmerCard(height: 130),
                        ),
                      ),
                    ),
                  ),
                  dataBuilder: (alerts) {
                    final filtered = _applyFilter(alerts, prefs.activeFilter);
                    if (filtered.isEmpty) {
                      return const _EmptyAlertsView();
                    }
                    return _AlertsListView(
                      alerts: filtered,
                      onTap: (alert) {
                        ref.read(alertsProvider.notifier).markAsRead(alert.id);
                        _showDetail(context, alert);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Alert> _applyFilter(List<Alert> alerts, AlertFilter filter) {
    switch (filter) {
      case AlertFilter.all:
        return alerts;
      case AlertFilter.unread:
        return alerts.where((a) => a.isUnread).toList();
      case AlertFilter.orders:
        return alerts.where((a) => a.category == AlertCategory.order).toList();
      case AlertFilter.offers:
        return alerts.where((a) => a.category == AlertCategory.offer).toList();
      case AlertFilter.account:
        return alerts
            .where((a) => a.category == AlertCategory.account)
            .toList();
    }
  }

  void _showDetail(BuildContext context, Alert alert) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _AlertDetailSheet(alert: alert),
    );
  }
}

// ---------------------------------------------------------------------------
// Body widgets
// ---------------------------------------------------------------------------

class _EmptyAlertsView extends StatelessWidget {
  const _EmptyAlertsView();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 300,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_none_rounded,
              size: 64,
              color: AppTheme.mutedSilver.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 24),
            Text(
              'Không có thông báo nào',
              style: GoogleFonts.playfairDisplay(
                fontSize: 20,
                fontWeight: FontWeight.w400,
                color: AppTheme.deepCharcoal.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AlertsListView extends StatelessWidget {
  final List<Alert> alerts;
  final void Function(Alert) onTap;
  const _AlertsListView({required this.alerts, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final todayAlerts = alerts.where((a) => a.isToday).toList();
    final olderAlerts = alerts.where((a) => !a.isToday).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (todayAlerts.isNotEmpty) ...[
            _SectionLabel(title: 'Mới hôm nay'),
            const SizedBox(height: 10),
            for (final alert in todayAlerts) ...[
              _AlertCard(alert: alert, onTap: () => onTap(alert)),
              const SizedBox(height: 8),
            ],
          ],
          if (olderAlerts.isNotEmpty) ...[
            if (todayAlerts.isNotEmpty) const SizedBox(height: 8),
            _SectionLabel(title: 'Trước đó'),
            const SizedBox(height: 10),
            for (final alert in olderAlerts) ...[
              _AlertCard(alert: alert, onTap: () => onTap(alert)),
              const SizedBox(height: 8),
            ],
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

class _MarkAllReadButton extends ConsumerWidget {
  final AsyncValue<List<Alert>> alertsAsync;
  const _MarkAllReadButton({required this.alertsAsync});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = alertsAsync.value?.where((a) => a.isUnread).length ?? 0;
    return TextButton(
      onPressed: unread == 0
          ? null
          : () => ref.read(alertsProvider.notifier).markAllAsRead(),
      child: Text(
        'Đánh dấu đã đọc',
        style: GoogleFonts.montserrat(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: unread == 0 ? AppTheme.mutedSilver : AppTheme.accentGold,
        ),
      ),
    );
  }
}

class _AlertsHeroCard extends StatelessWidget {
  final AsyncValue<List<Alert>> alertsAsync;
  const _AlertsHeroCard({required this.alertsAsync});

  @override
  Widget build(BuildContext context) {
    final unread = alertsAsync.value?.where((a) => a.isUnread).length ?? 0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF5E8D5), Color(0xFFE0C79E)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepCharcoal.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    unread == 0 ? 'Bạn đã xem hết' : '$unread chưa đọc',
                    style: GoogleFonts.montserrat(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  unread == 0
                      ? 'Bạn đã cập nhật mọi thứ!'
                      : 'Bạn có $unread thông báo mới đang chờ.',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 18,
                    height: 1.2,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.notifications_active_outlined,
              color: AppTheme.deepCharcoal,
              size: 22,
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationPreferencesCard extends ConsumerWidget {
  final AlertsPrefs prefs;
  const _NotificationPreferencesCard({required this.prefs});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(alertsPrefsProvider.notifier);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          _PreferenceRow(
            title: 'Cập nhật đơn hàng',
            subtitle: 'Xác nhận giao hàng, chuẩn bị đơn và thanh toán',
            value: prefs.orderUpdatesEnabled,
            onChanged: notifier.toggleOrderUpdates,
          ),
          Divider(color: AppTheme.softTaupe.withValues(alpha: 0.8), height: 28),
          _PreferenceRow(
            title: 'Ưu đãi riêng',
            subtitle: 'Ưu đãi thành viên, gói giới hạn và mã giảm giá',
            value: prefs.offerUpdatesEnabled,
            onChanged: notifier.toggleOfferUpdates,
          ),
          Divider(color: AppTheme.softTaupe.withValues(alpha: 0.8), height: 28),
          _PreferenceRow(
            title: 'Cảnh báo tài khoản',
            subtitle: 'Thông báo có hàng lại và nhắc nhở hoạt động hồ sơ',
            value: prefs.accountAlertsEnabled,
            onChanged: notifier.toggleAccountAlerts,
          ),
        ],
      ),
    );
  }
}

class _PreferenceRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _PreferenceRow({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  height: 1.5,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.mutedSilver,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Switch.adaptive(
          value: value,
          activeThumbColor: AppTheme.accentGold,
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _FilterChipsRow extends ConsumerWidget {
  final AlertFilter activeFilter;
  final int unreadCount;
  const _FilterChipsRow({
    required this.activeFilter,
    required this.unreadCount,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(alertsPrefsProvider.notifier);
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _Chip(
            label: 'Tất cả',
            isSelected: activeFilter == AlertFilter.all,
            onTap: () => notifier.setFilter(AlertFilter.all),
          ),
          _Chip(
            label: 'Chưa đọc',
            count: unreadCount,
            isSelected: activeFilter == AlertFilter.unread,
            onTap: () => notifier.setFilter(AlertFilter.unread),
          ),
          _Chip(
            label: 'Đơn hàng',
            isSelected: activeFilter == AlertFilter.orders,
            onTap: () => notifier.setFilter(AlertFilter.orders),
          ),
          _Chip(
            label: 'Ưu đãi',
            isSelected: activeFilter == AlertFilter.offers,
            onTap: () => notifier.setFilter(AlertFilter.offers),
          ),
          _Chip(
            label: 'Tài khoản',
            isSelected: activeFilter == AlertFilter.account,
            onTap: () => notifier.setFilter(AlertFilter.account),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final int? count;
  final bool isSelected;
  final VoidCallback onTap;
  const _Chip({
    required this.label,
    this.count,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: isSelected ? AppTheme.deepCharcoal : Colors.white,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? Colors.white : AppTheme.deepCharcoal,
                  ),
                ),
                if (count != null && count! > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.accentGold
                          : AppTheme.ivoryBackground,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '$count',
                      style: GoogleFonts.montserrat(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: isSelected
                            ? AppTheme.deepCharcoal
                            : AppTheme.accentGold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String title;
  const _SectionLabel({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.montserrat(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.8,
        color: AppTheme.mutedSilver,
      ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  final Alert alert;
  final VoidCallback onTap;
  const _AlertCard({required this.alert, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: alert.isUnread
          ? alert.accentColor.withValues(alpha: 0.06)
          : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: alert.isUnread
                  ? alert.accentColor.withValues(alpha: 0.3)
                  : AppTheme.softTaupe.withValues(alpha: 0.5),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: alert.accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(alert.icon, size: 20, color: alert.accentColor),
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            alert.title,
                            style: GoogleFonts.montserrat(
                              fontSize: 13,
                              fontWeight: alert.isUnread
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: alert.isUnread
                                  ? AppTheme.deepCharcoal
                                  : AppTheme.deepCharcoal.withValues(
                                      alpha: 0.7,
                                    ),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (alert.isUnread)
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(left: 6),
                            decoration: BoxDecoration(
                              color: alert.accentColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      alert.message,
                      style: GoogleFonts.montserrat(
                        fontSize: 12,
                        height: 1.4,
                        fontWeight: FontWeight.w400,
                        color: AppTheme.deepCharcoal.withValues(alpha: 0.6),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: alert.accentColor.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            alert.categoryLabel,
                            style: GoogleFonts.montserrat(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: alert.accentColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          alert.timeLabel,
                          style: GoogleFonts.montserrat(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.mutedSilver,
                          ),
                        ),
                        if (alert.actionLabel != null) ...[
                          const Spacer(),
                          Text(
                            alert.actionLabel!,
                            style: GoogleFonts.montserrat(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: alert.accentColor,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Icon(
                            Icons.chevron_right_rounded,
                            size: 14,
                            color: alert.accentColor,
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AlertDetailSheet extends StatelessWidget {
  final Alert alert;
  const _AlertDetailSheet({required this.alert});

  void _handleAction(BuildContext context) {
    Navigator.pop(context);
    if (alert.category == AlertCategory.order && alert.orderId != null) {
      context.push(AppRoutes.trackOrderWithId(alert.orderId!));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
      decoration: const BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.softTaupe,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: alert.accentColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(alert.icon, size: 22, color: alert.accentColor),
            ),
            const SizedBox(height: 14),
            Text(
              alert.title,
              style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              alert.timeLabel,
              style: GoogleFonts.montserrat(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.mutedSilver,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              alert.message,
              style: GoogleFonts.montserrat(
                fontSize: 13,
                height: 1.6,
                fontWeight: FontWeight.w400,
                color: AppTheme.deepCharcoal.withValues(alpha: 0.8),
              ),
            ),
            if (alert.actionLabel != null) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _handleAction(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: alert.accentColor,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    alert.actionLabel!,
                    style: GoogleFonts.montserrat(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
