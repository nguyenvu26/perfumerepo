import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_client.dart';
import '../models/inventory_models.dart';
import '../services/inventory_service.dart';
import '../../models/staff_store.dart';

// ── Service Provider ────────────────────────────────────────────────

final staffInventoryServiceProvider = Provider<StaffInventoryService>((ref) {
  final client = ref.watch(apiClientProvider);
  return StaffInventoryService(client: client);
});

// ── Store List ──────────────────────────────────────────────────────

final staffStoresProvider = FutureProvider<List<StaffStore>>((ref) async {
  final service = ref.watch(staffInventoryServiceProvider);
  return service.getMyStores();
});

// ── Selected Store ──────────────────────────────────────────────────

final selectedStoreIdProvider = StateProvider<String?>((ref) => null);

// ── Inventory Overview ──────────────────────────────────────────────

class InventoryState {
  final InventoryOverview? overview;
  final bool isLoading;
  final String? error;

  const InventoryState({this.overview, this.isLoading = false, this.error});

  InventoryState copyWith({
    InventoryOverview? overview,
    bool? isLoading,
    String? error,
  }) {
    return InventoryState(
      overview: overview ?? this.overview,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class InventoryNotifier extends StateNotifier<InventoryState> {
  final StaffInventoryService _service;

  InventoryNotifier(this._service) : super(const InventoryState());

  Future<void> loadOverview(String storeId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final overview = await _service.getOverview(storeId);
      state = InventoryState(overview: overview);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<InventoryRequestModel?> importStock({
    required String storeId,
    required String variantId,
    required int quantity,
    String? reason,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final request = await _service.importStock(
        storeId: storeId,
        variantId: variantId,
        quantity: quantity,
        reason: reason,
      );
      // Reload overview (stock hasn't changed yet, but keep UI fresh)
      await loadOverview(storeId);
      return request;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }

  Future<InventoryRequestModel?> adjustStock({
    required String storeId,
    required String variantId,
    required int delta,
    required String reason,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final request = await _service.adjustStock(
        storeId: storeId,
        variantId: variantId,
        delta: delta,
        reason: reason,
      );
      await loadOverview(storeId);
      return request;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }
}

final inventoryProvider =
    StateNotifierProvider<InventoryNotifier, InventoryState>((ref) {
      final service = ref.watch(staffInventoryServiceProvider);
      return InventoryNotifier(service);
    });

// ── Inventory Logs ──────────────────────────────────────────────────

final inventoryLogsProvider = FutureProvider.family<List<InventoryLog>, String>(
  (ref, storeId) async {
    final service = ref.watch(staffInventoryServiceProvider);
    return service.getLogs(storeId: storeId);
  },
);

// ── My Inventory Requests ───────────────────────────────────────────

final myInventoryRequestsProvider =
    FutureProvider.family<List<InventoryRequestModel>, String?>((
      ref,
      storeId,
    ) async {
      final service = ref.watch(staffInventoryServiceProvider);
      return service.getMyRequests(storeId: storeId);
    });
