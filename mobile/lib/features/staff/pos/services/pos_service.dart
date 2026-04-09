import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_endpoints.dart';
import '../../../../core/utils/api_error_mapper.dart';
import '../../models/staff_store.dart';
import '../models/pos_models.dart';

class ReturnItemRequest {
  final String variantId;
  final int quantity;
  final String? reason;

  ReturnItemRequest({
    required this.variantId,
    required this.quantity,
    this.reason,
  });

  Map<String, dynamic> toJson() => {
    'variantId': variantId,
    'quantity': quantity,
    if (reason != null && reason!.isNotEmpty) 'reason': reason,
  };
}

class CreateReturnRequest {
  final String orderId;
  final List<ReturnItemRequest> items;
  final String? reason;

  CreateReturnRequest({
    required this.orderId,
    required this.items,
    this.reason,
  });

  Map<String, dynamic> toJson() => {
    'orderId': orderId,
    'origin': 'POS',
    'items': items.map((e) => e.toJson()).toList(),
    if (reason != null && reason!.isNotEmpty) 'reason': reason,
  };
}

class StaffPosService {
  final ApiClient client;
  StaffPosService({required this.client});

  Never _rethrowMapped(dynamic e) =>
      throw Exception(ApiErrorMapper.toUserMessage(e));

  Future<List<PosProduct>> searchProducts({
    String? query,
    String? barcode,
    String? storeId,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await client.get(
        ApiEndpoints.staffPosProducts,
        queryParameters: {
          if (query != null && query.isNotEmpty) 'q': query,
          if (barcode != null && barcode.isNotEmpty) 'barcode': barcode,
          if (storeId != null && storeId.isNotEmpty) 'storeId': storeId,
          'page': page,
          'limit': limit,
        },
      );

      final data = response.data;
      if (data is List) {
        return data
            .map((e) => PosProduct.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
      if (data is Map && data['data'] is List) {
        final list = data['data'] as List;
        return list
            .map((e) => PosProduct.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
      return const [];
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<List<StaffStore>> getMyStores() async {
    try {
      final response = await client.get(ApiEndpoints.myStores);
      final data = response.data;
      if (data is List) {
        return data
            .map((e) => StaffStore.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
      if (data is Map && data['data'] is List) {
        final list = data['data'] as List;
        return list
            .map((e) => StaffStore.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
      return const [];
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<PosOrder> createDraftOrder({required String storeId}) async {
    try {
      final response = await client.post(
        ApiEndpoints.staffPosOrders,
        data: {'storeId': storeId},
      );
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return PosOrder.fromJson(Map<String, dynamic>.from(data));
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<Map<String, dynamic>> checkout({
    required String storeId,
    required List<Map<String, dynamic>> items,
    required String paymentMethod,
    String? customerPhone,
  }) async {
    try {
      final response = await client.post(
        ApiEndpoints.staffPosCheckout,
        data: {
          'storeId': storeId,
          'items': items,
          'paymentMethod': paymentMethod,
          if (customerPhone != null && customerPhone.isNotEmpty)
            'customerPhone': customerPhone,
        },
      );
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return Map<String, dynamic>.from(data as Map);
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<PosOrder> upsertItem({
    required String orderId,
    required String variantId,
    required int quantity,
  }) async {
    try {
      final response = await client.patch(
        ApiEndpoints.staffPosOrderItems(orderId),
        data: {'variantId': variantId, 'quantity': quantity},
      );
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return PosOrder.fromJson(Map<String, dynamic>.from(data));
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<PosOrder> setCustomer({
    required String orderId,
    required String customerPhone,
  }) async {
    try {
      final response = await client.patch(
        ApiEndpoints.staffPosOrderCustomer(orderId),
        data: {'customerPhone': customerPhone},
      );
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return PosOrder.fromJson(Map<String, dynamic>.from(data));
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<PosOrder> payCash(String orderId) async {
    try {
      final response = await client.post(ApiEndpoints.staffPosPayCash(orderId));
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return PosOrder.fromJson(Map<String, dynamic>.from(data));
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<Map<String, dynamic>> payQr(String orderId) async {
    try {
      final response = await client.post(ApiEndpoints.staffPosPayQr(orderId));
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return Map<String, dynamic>.from(data as Map);
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<PosOrder> getOrder(String orderId) async {
    try {
      final response = await client.get(
        ApiEndpoints.staffPosOrderById(orderId),
      );
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return PosOrder.fromJson(Map<String, dynamic>.from(data));
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<bool> cancelOrder(String orderId) async {
    try {
      await client.patch(ApiEndpoints.staffPosCancelOrder(orderId));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> createPosReturn(
    CreateReturnRequest request,
  ) async {
    try {
      final response = await client.post(
        '/returns/admin/pos/create',
        data: request.toJson(),
      );
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return Map<String, dynamic>.from(data as Map);
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<Map<String, dynamic>> receiveReturn({
    required String returnId,
    required List<Map<String, dynamic>> items,
    String? note,
    String receivedLocation = 'POS',
  }) async {
    try {
      final response = await client.patch(
        '/returns/admin/$returnId/receive',
        data: {
          'items': items,
          'receivedLocation': receivedLocation,
          if (note != null && note.isNotEmpty) 'note': note,
        },
      );
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return Map<String, dynamic>.from(data as Map);
    } catch (e) {
      _rethrowMapped(e);
    }
  }

  Future<Map<String, dynamic>> refundReturn({
    required String returnId,
    required String method,
    String? transactionId,
    String? note,
  }) async {
    try {
      final response = await client.post(
        '/returns/admin/$returnId/refund',
        data: {
          'method': method,
          if (transactionId != null && transactionId.isNotEmpty)
            'transactionId': transactionId,
          if (note != null && note.isNotEmpty) 'note': note,
        },
      );
      final data = response.data is Map && response.data['data'] != null
          ? response.data['data']
          : response.data;
      return Map<String, dynamic>.from(data as Map);
    } catch (e) {
      _rethrowMapped(e);
    }
  }
}
