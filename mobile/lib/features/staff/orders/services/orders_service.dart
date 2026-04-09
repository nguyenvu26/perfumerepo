import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_endpoints.dart';
import '../models/orders_models.dart';

class StaffOrdersService {
  final ApiClient _client;

  StaffOrdersService({required ApiClient client}) : _client = client;

  Future<OrdersPage> listOrders({
    int skip = 0,
    int take = 20,
    String? search,
  }) async {
    final response = await _client.get(
      ApiEndpoints.staffOrders,
      queryParameters: {
        'skip': skip,
        'take': take,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return OrdersPage.fromJson(response.data as Map<String, dynamic>);
  }

  Future<StaffOrder> getOrderDetail(String id) async {
    final response = await _client.get(ApiEndpoints.staffOrderById(id));
    return StaffOrder.fromJson(response.data as Map<String, dynamic>);
  }
}
