import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_client.dart';
import '../models/daily_report.dart';
import '../services/dashboard_service.dart';

// ── Service Provider ────────────────────────────────────────────────

final staffDashboardServiceProvider = Provider<StaffDashboardService>((ref) {
  final client = ref.watch(apiClientProvider);
  return StaffDashboardService(client: client);
});

// ── Dashboard State ─────────────────────────────────────────────────

class DashboardState {
  final DailyReport? report;
  final bool isLoading;
  final String? error;
  final DateTime selectedDate;

  DashboardState({
    this.report,
    this.isLoading = false,
    this.error,
    DateTime? selectedDate,
  }) : selectedDate = selectedDate ?? DateTime.now();

  DashboardState copyWith({
    DailyReport? report,
    bool? isLoading,
    String? error,
    DateTime? selectedDate,
  }) {
    return DashboardState(
      report: report ?? this.report,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedDate: selectedDate ?? this.selectedDate,
    );
  }
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final StaffDashboardService _service;

  DashboardNotifier(this._service) : super(DashboardState()) {
    loadReport();
  }

  Future<void> loadReport({DateTime? date}) async {
    final target = date ?? state.selectedDate;
    state = state.copyWith(isLoading: true, error: null, selectedDate: target);
    try {
      final dateStr =
          '${target.year}-${target.month.toString().padLeft(2, '0')}-${target.day.toString().padLeft(2, '0')}';
      final report = await _service.getDailyReport(date: dateStr);
      state = DashboardState(report: report, selectedDate: target);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void changeDate(DateTime date) => loadReport(date: date);
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  final service = ref.watch(staffDashboardServiceProvider);
  return DashboardNotifier(service);
});
