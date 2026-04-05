import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/address.dart';
import '../models/ghn_models.dart';

class AddressService {
  final ApiClient _client;

  AddressService({required ApiClient client}) : _client = client;

  Future<List<Address>> getAddresses() async {
    final response = await _client.get(ApiEndpoints.addresses);
    final data = response.data;
    final rawList = _asList(data);
    return rawList
        .whereType<Map>()
        .map((raw) => Address.fromJson(raw.cast<String, dynamic>()))
        .toList();
  }

  Future<Address> createAddress(Address address) async {
    final response = await _client.post(
      ApiEndpoints.addresses,
      data: address.toApiPayload(),
    );
    return Address.fromJson(_asMap(response.data));
  }

  Future<Address> updateAddress(String id, Address address) async {
    final response = await _client.patch(
      ApiEndpoints.addressById(id),
      data: address.toApiPayload(),
    );
    return Address.fromJson(_asMap(response.data));
  }

  Future<void> deleteAddress(String id) async {
    await _client.delete(ApiEndpoints.addressById(id));
  }

  Future<void> setDefaultAddress(String id) async {
    await _client.patch(ApiEndpoints.addressDefault(id));
  }

  Future<List<GhnProvince>> getProvinces() async {
    final response = await _client.get(ApiEndpoints.ghnProvinces);
    return _asList(response.data)
        .whereType<Map>()
        .map((raw) => GhnProvince.fromJson(raw.cast<String, dynamic>()))
        .toList();
  }

  Future<List<GhnDistrict>> getDistricts(int provinceId) async {
    final response = await _client.get(
      ApiEndpoints.ghnDistricts,
      queryParameters: {'provinceId': provinceId},
    );
    return _asList(response.data)
        .whereType<Map>()
        .map((raw) => GhnDistrict.fromJson(raw.cast<String, dynamic>()))
        .toList();
  }

  Future<List<GhnWard>> getWards(int districtId) async {
    final response = await _client.get(
      ApiEndpoints.ghnWards,
      queryParameters: {'districtId': districtId},
    );
    return _asList(response.data)
        .whereType<Map>()
        .map((raw) => GhnWard.fromJson(raw.cast<String, dynamic>()))
        .toList();
  }

  Future<List<GhnServiceOption>> getServices(int districtId) async {
    final response = await _client.get(
      ApiEndpoints.ghnServices,
      queryParameters: {'toDistrictId': districtId},
    );
    return _asList(response.data)
        .whereType<Map>()
        .map((raw) => GhnServiceOption.fromJson(raw.cast<String, dynamic>()))
        .toList();
  }

  Future<int> calculateShippingFee({
    required int districtId,
    required String wardCode,
    required int serviceId,
    int codValue = 0,
  }) async {
    final response = await _client.post(
      ApiEndpoints.ghnCalculateFee,
      data: {
        'toDistrictId': districtId,
        'toWardCode': wardCode,
        'serviceId': serviceId,
        'codValue': codValue,
        'weight': 500,
      },
    );

    final data = _asMap(response.data);
    return _readInt(data['total'] ?? data['fee'] ?? data['total_fee']);
  }
}

final addressServiceProvider = Provider<AddressService>((ref) {
  final client = ref.watch(apiClientProvider);
  return AddressService(client: client);
});

String parseAddressError(Object error) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map) {
      final msg = data['message'];
      if (msg is List && msg.isNotEmpty) {
        final merged = msg.join(', ');
        if (merged.toLowerCase().contains('should not exist')) {
          return 'Dữ liệu địa chỉ không đúng định dạng. Vui lòng kiểm tra lại.';
        }
        return merged;
      }
      if (msg != null) {
        final text = msg.toString();
        if (text.toLowerCase().contains('internal server error')) {
          return 'Hệ thống đang bận, vui lòng thử lại sau.';
        }
        return text;
      }
    }

    if (status == 400) {
      return 'Thông tin địa chỉ chưa hợp lệ. Vui lòng kiểm tra lại.';
    }
    if (status == 401 || status == 403) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    if (status != null && status >= 500) {
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    }
    return error.message ?? 'Không thể kết nối máy chủ';
  }
  return error.toString();
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((k, v) => MapEntry(k.toString(), v));
  }
  return <String, dynamic>{};
}

List<dynamic> _asList(dynamic value) {
  if (value is List) return value;
  if (value is Map<String, dynamic> && value['data'] is List) {
    return value['data'] as List<dynamic>;
  }
  if (value is Map && value['data'] is List) {
    return value['data'] as List<dynamic>;
  }
  return const <dynamic>[];
}

int _readInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
