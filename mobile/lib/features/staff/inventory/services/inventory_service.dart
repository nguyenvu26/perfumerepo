import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_endpoints.dart';
import '../models/inventory_models.dart';
import '../../models/staff_store.dart';

class StaffInventoryService {
  final ApiClient _client;

  StaffInventoryService({required ApiClient client}) : _client = client;

  /// Fetch stores assigned to the current staff user.
  Future<List<StaffStore>> getMyStores() async {
    final response = await _client.get(ApiEndpoints.myStores);
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map((e) => StaffStore.fromJson(e))
        .toList();
  }

  /// Fetch inventory overview for a specific store.
  Future<InventoryOverview> getOverview(String storeId) async {
    final response = await _client.get(
      ApiEndpoints.staffInventory,
      queryParameters: {'storeId': storeId},
    );
    return InventoryOverview.fromJson(response.data as Map<String, dynamic>);
  }

  /// Import stock for a variant at a store. Returns a pending request.
  Future<InventoryRequestModel> importStock({
    required String storeId,
    required String variantId,
    required int quantity,
    String? reason,
  }) async {
    final response = await _client.post(
      ApiEndpoints.staffInventoryImport,
      data: {
        'storeId': storeId,
        'variantId': variantId,
        'quantity': quantity,
        if (reason != null) 'reason': reason,
      },
    );
    return InventoryRequestModel.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  /// Adjust stock for a variant at a store. Returns a pending request.
  Future<InventoryRequestModel> adjustStock({
    required String storeId,
    required String variantId,
    required int delta,
    required String reason,
  }) async {
    final response = await _client.post(
      ApiEndpoints.staffInventoryAdjust,
      data: {
        'storeId': storeId,
        'variantId': variantId,
        'delta': delta,
        'reason': reason,
      },
    );
    return InventoryRequestModel.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  /// Fetch staff's own inventory requests.
  Future<List<InventoryRequestModel>> getMyRequests({String? storeId}) async {
    final response = await _client.get(
      ApiEndpoints.staffInventoryRequests,
      queryParameters: {if (storeId != null) 'storeId': storeId},
    );
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map((e) => InventoryRequestModel.fromJson(e))
        .toList();
  }

  /// Fetch inventory activity logs.
  Future<List<InventoryLog>> getLogs({
    String? storeId,
    String? variantId,
  }) async {
    final response = await _client.get(
      ApiEndpoints.staffInventoryLogs,
      queryParameters: {
        if (storeId != null) 'storeId': storeId,
        if (variantId != null) 'variantId': variantId,
      },
    );
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map((e) => InventoryLog.fromJson(e))
        .toList();
  }

  /// Search all system product variants for import.
  Future<List<SystemVariant>> searchAllProducts({String? query}) async {
    final response = await _client.get(
      ApiEndpoints.staffInventorySearchProducts,
      queryParameters: {if (query != null && query.isNotEmpty) 'q': query},
    );
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map((e) => SystemVariant.fromJson(e))
        .toList();
  }
}
