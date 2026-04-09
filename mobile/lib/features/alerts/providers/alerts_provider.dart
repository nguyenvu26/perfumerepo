import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/alert.dart';
import '../services/notification_service.dart';

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class AlertsNotifier extends AsyncNotifier<List<Alert>> {
  @override
  Future<List<Alert>> build() async {
    final service = ref.read(notificationServiceProvider);
    try {
      final response = await service.getNotifications(take: 50);
      return response.data.map(Alert.fromNotification).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }

  Future<void> markAsRead(String id) async {
    final service = ref.read(notificationServiceProvider);
    try {
      await service.markAsRead(id);
    } catch (_) {}
    final current = state.value;
    if (current == null) return;
    state = AsyncData(
      current.map((a) => a.id == id ? a.copyWith(isUnread: false) : a).toList(),
    );
  }

  Future<void> markAllAsRead() async {
    final service = ref.read(notificationServiceProvider);
    try {
      await service.markAllAsRead();
    } catch (_) {}
    final current = state.value;
    if (current == null) return;
    state = AsyncData(current.map((a) => a.copyWith(isUnread: false)).toList());
  }
}

// ---------------------------------------------------------------------------
// Preference notifier (filter + toggles — synchronous UI state)
// ---------------------------------------------------------------------------
class AlertsPrefsNotifier extends Notifier<AlertsPrefs> {
  @override
  AlertsPrefs build() => const AlertsPrefs();

  void setFilter(AlertFilter filter) =>
      state = state.copyWith(activeFilter: filter);

  void toggleOrderUpdates(bool value) =>
      state = state.copyWith(orderUpdatesEnabled: value);

  void toggleOfferUpdates(bool value) =>
      state = state.copyWith(offerUpdatesEnabled: value);

  void toggleAccountAlerts(bool value) =>
      state = state.copyWith(accountAlertsEnabled: value);
}

class AlertsPrefs {
  final AlertFilter activeFilter;
  final bool orderUpdatesEnabled;
  final bool offerUpdatesEnabled;
  final bool accountAlertsEnabled;

  const AlertsPrefs({
    this.activeFilter = AlertFilter.all,
    this.orderUpdatesEnabled = true,
    this.offerUpdatesEnabled = true,
    this.accountAlertsEnabled = false,
  });

  AlertsPrefs copyWith({
    AlertFilter? activeFilter,
    bool? orderUpdatesEnabled,
    bool? offerUpdatesEnabled,
    bool? accountAlertsEnabled,
  }) {
    return AlertsPrefs(
      activeFilter: activeFilter ?? this.activeFilter,
      orderUpdatesEnabled: orderUpdatesEnabled ?? this.orderUpdatesEnabled,
      offerUpdatesEnabled: offerUpdatesEnabled ?? this.offerUpdatesEnabled,
      accountAlertsEnabled: accountAlertsEnabled ?? this.accountAlertsEnabled,
    );
  }
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------
final alertsProvider = AsyncNotifierProvider<AlertsNotifier, List<Alert>>(
  AlertsNotifier.new,
);

final alertsPrefsProvider = NotifierProvider<AlertsPrefsNotifier, AlertsPrefs>(
  AlertsPrefsNotifier.new,
);

/// Provides the unread notification count
final unreadCountProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(notificationServiceProvider);
  try {
    return await service.getUnreadCount();
  } catch (_) {
    return 0;
  }
});
