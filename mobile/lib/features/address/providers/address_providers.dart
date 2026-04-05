import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/address.dart';
import '../models/address_form_state.dart';
import '../services/address_service.dart';

final selectedAddressProvider = StateProvider<Address?>((ref) => null);

class AddressListNotifier extends AsyncNotifier<List<Address>> {
  @override
  Future<List<Address>> build() async {
    final service = ref.read(addressServiceProvider);
    final addresses = await service.getAddresses();
    _syncSelectedAddress(addresses);
    return _sortAddresses(addresses);
  }

  Future<void> reload() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(build);
  }

  Future<void> deleteAddress(String id) async {
    final service = ref.read(addressServiceProvider);
    final current = state.value ?? const <Address>[];

    state = const AsyncLoading();
    try {
      await service.deleteAddress(id);
      final updated = current.where((item) => item.id != id).toList();
      _syncSelectedAddress(updated);
      state = AsyncData(_sortAddresses(updated));
    } catch (error, stack) {
      state = AsyncError(error, stack);
      rethrow;
    }
  }

  Future<void> setDefaultAddress(String id) async {
    final service = ref.read(addressServiceProvider);
    final current = state.value ?? const <Address>[];

    state = const AsyncLoading();
    try {
      await service.setDefaultAddress(id);
      final updated = current
          .map((address) => address.copyWith(isDefault: address.id == id))
          .toList();
      _syncSelectedAddress(updated, preferId: id);
      state = AsyncData(_sortAddresses(updated));
    } catch (error, stack) {
      state = AsyncError(error, stack);
      rethrow;
    }
  }

  void selectAddress(Address address) {
    ref.read(selectedAddressProvider.notifier).state = address;
  }

  Future<void> upsertAddress(Address address) async {
    final service = ref.read(addressServiceProvider);
    final current = state.value ?? const <Address>[];

    state = const AsyncLoading();
    try {
      final savedFromApi = address.id.isEmpty
          ? await service.createAddress(address)
          : await service.updateAddress(address.id, address);

      // Backend does not persist UI-only fields like serviceId/label/note yet,
      // so keep user-selected values in local state for checkout UX.
      final saved = savedFromApi.copyWith(
        label: address.label,
        serviceId: address.serviceId,
        note: address.note,
      );

      final exists = current.any((item) => item.id == saved.id);
      final updated = exists
          ? current.map((item) => item.id == saved.id ? saved : item).toList()
          : [saved, ...current];

      final normalized = saved.isDefault
          ? updated
                .map(
                  (item) => item.id == saved.id
                      ? item.copyWith(isDefault: true)
                      : item.copyWith(isDefault: false),
                )
                .toList()
          : updated;

      _syncSelectedAddress(normalized, preferId: saved.id);
      state = AsyncData(_sortAddresses(normalized));
    } catch (error, stack) {
      state = AsyncError(error, stack);
      rethrow;
    }
  }

  void _syncSelectedAddress(List<Address> addresses, {String? preferId}) {
    final current = ref.read(selectedAddressProvider);

    if (addresses.isEmpty) {
      ref.read(selectedAddressProvider.notifier).state = null;
      return;
    }

    Address? selected;
    if (preferId != null) {
      for (final item in addresses) {
        if (item.id == preferId) {
          selected = item;
          break;
        }
      }
    }

    selected ??= current == null
        ? null
        : addresses.cast<Address?>().firstWhere(
            (item) => item?.id == current.id,
            orElse: () => null,
          );

    selected ??= addresses.cast<Address?>().firstWhere(
      (item) => item?.isDefault == true,
      orElse: () => null,
    );

    selected ??= addresses.first;

    ref.read(selectedAddressProvider.notifier).state = selected;
  }

  List<Address> _sortAddresses(List<Address> addresses) {
    final sorted = [...addresses];
    sorted.sort((a, b) {
      if (a.isDefault == b.isDefault) return 0;
      return a.isDefault ? -1 : 1;
    });
    return sorted;
  }
}

final addressListProvider =
    AsyncNotifierProvider<AddressListNotifier, List<Address>>(
      AddressListNotifier.new,
    );

class AddressFormNotifier extends StateNotifier<AddressFormState> {
  final Ref _ref;
  final Address? _initialAddress;

  AddressFormNotifier({required Ref ref, required Address? initialAddress})
    : _ref = ref,
      _initialAddress = initialAddress,
      super(AddressFormState.fromAddress(initialAddress)) {
    _initialize();
  }

  AddressService get _service => _ref.read(addressServiceProvider);

  Future<void> _initialize() async {
    await loadProvinces();

    final provinceId = state.provinceId;
    final districtId = state.districtId;
    final wardCode = state.wardCode;
    final serviceId = state.serviceId;

    if (provinceId != null) {
      try {
        final districts = await _service.getDistricts(provinceId);
        state = state.copyWith(districts: districts);
      } catch (e) {
        state = state.copyWith(errorMessage: parseAddressError(e));
      }
    }

    if (districtId != null) {
      try {
        final wards = await _service.getWards(districtId);
        final services = await _service.getServices(districtId);
        state = state.copyWith(
          wards: wards,
          services: services,
          districtId: districtId,
          wardCode: wardCode,
          serviceId: serviceId,
        );
      } catch (e) {
        state = state.copyWith(errorMessage: parseAddressError(e));
      }
    }
  }

  Future<void> loadProvinces() async {
    state = state.copyWith(loadingProvinces: true, errorMessage: null);
    try {
      final provinces = await _service.getProvinces();
      state = state.copyWith(loadingProvinces: false, provinces: provinces);
    } catch (e) {
      state = state.copyWith(
        loadingProvinces: false,
        errorMessage: parseAddressError(e),
      );
    }
  }

  Future<void> loadDistricts(int provinceId) async {
    final clearedErrors = Map<String, String>.from(state.fieldErrors)
      ..remove('provinceId')
      ..remove('districtId')
      ..remove('wardCode');

    state = state.copyWith(
      provinceId: provinceId,
      loadingDistricts: true,
      districts: const [],
      wards: const [],
      services: const [],
      clearDistrict: true,
      clearWard: true,
      clearService: true,
      fieldErrors: clearedErrors,
      errorMessage: null,
    );

    try {
      final districts = await _service.getDistricts(provinceId);
      state = state.copyWith(loadingDistricts: false, districts: districts);
    } catch (e) {
      state = state.copyWith(
        loadingDistricts: false,
        errorMessage: parseAddressError(e),
      );
    }
  }

  Future<void> loadWards(int districtId) async {
    final clearedErrors = Map<String, String>.from(state.fieldErrors)
      ..remove('districtId')
      ..remove('wardCode');

    state = state.copyWith(
      districtId: districtId,
      loadingWards: true,
      wards: const [],
      clearWard: true,
      fieldErrors: clearedErrors,
      errorMessage: null,
    );

    try {
      final wards = await _service.getWards(districtId);
      state = state.copyWith(loadingWards: false, wards: wards);
    } catch (e) {
      state = state.copyWith(
        loadingWards: false,
        errorMessage: parseAddressError(e),
      );
    }
  }

  Future<void> loadServices(int districtId) async {
    state = state.copyWith(
      districtId: districtId,
      loadingServices: true,
      services: const [],
      clearService: true,
      errorMessage: null,
    );

    try {
      final services = await _service.getServices(districtId);
      state = state.copyWith(loadingServices: false, services: services);
    } catch (e) {
      state = state.copyWith(
        loadingServices: false,
        errorMessage: parseAddressError(e),
      );
    }
  }

  void setLabel(AddressLabel label) {
    state = state.copyWith(label: label, errorMessage: null);
  }

  void setRecipientName(String value) {
    state = state.copyWith(
      recipientName: value,
      fieldErrors: _removeFieldError('recipientName'),
      errorMessage: null,
    );
  }

  void setPhone(String value) {
    final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
    final normalized = digits.length > 11 ? digits.substring(0, 11) : digits;
    state = state.copyWith(
      phone: normalized,
      fieldErrors: _removeFieldError('phone'),
      errorMessage: null,
    );
  }

  void setDetailAddress(String value) {
    state = state.copyWith(
      detailAddress: value,
      fieldErrors: _removeFieldError('detailAddress'),
      errorMessage: null,
    );
  }

  void setNote(String value) {
    state = state.copyWith(note: value);
  }

  void setDefaultAddress(bool value) {
    state = state.copyWith(isDefault: value);
  }

  void setWardCode(String wardCode) {
    state = state.copyWith(
      wardCode: wardCode,
      fieldErrors: _removeFieldError('wardCode'),
      errorMessage: null,
    );
  }

  void setServiceId(int serviceId) {
    state = state.copyWith(serviceId: serviceId, errorMessage: null);
  }

  Future<bool> submit() async {
    final errors = _validateAll();
    if (errors.isNotEmpty) {
      state = state.copyWith(fieldErrors: errors, errorMessage: null);
      return false;
    }

    state = state.copyWith(
      isSubmitting: true,
      fieldErrors: const {},
      errorMessage: null,
    );

    try {
      final selectedProvince = state.provinces.firstWhere(
        (item) => item.id == state.provinceId,
      );
      final selectedDistrict = state.districts.firstWhere(
        (item) => item.id == state.districtId,
      );
      final selectedWard = state.wards.firstWhere(
        (item) => item.code == state.wardCode,
      );

      final detailAddress = state.detailAddress.trim();
      final fullAddress = [
        detailAddress,
        selectedWard.name,
        selectedDistrict.name,
        selectedProvince.name,
      ].join(', ');

      final address = Address(
        id: _initialAddress?.id ?? '',
        label: state.label,
        recipientName: state.recipientName.trim(),
        phone: state.phone.trim(),
        detailAddress: detailAddress,
        fullAddress: fullAddress,
        provinceId: state.provinceId!,
        provinceName: selectedProvince.name,
        districtId: state.districtId!,
        districtName: selectedDistrict.name,
        wardCode: state.wardCode!,
        wardName: selectedWard.name,
        serviceId: state.serviceId ?? 0,
        isDefault: state.isDefault,
        note: state.note.trim().isEmpty ? null : state.note.trim(),
      );

      await _ref.read(addressListProvider.notifier).upsertAddress(address);
      state = state.copyWith(isSubmitting: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: _friendlySubmitError(parseAddressError(e)),
      );
      return false;
    }
  }

  Map<String, String> _removeFieldError(String field) {
    if (!state.fieldErrors.containsKey(field)) return state.fieldErrors;
    final map = Map<String, String>.from(state.fieldErrors);
    map.remove(field);
    return map;
  }

  Map<String, String> _validateAll() {
    final errors = <String, String>{};

    if (state.recipientName.trim().isEmpty) {
      errors['recipientName'] = 'Vui lòng nhập tên người nhận';
    }

    final phone = state.phone.trim();
    if (phone.isEmpty) {
      errors['phone'] = 'Vui lòng nhập số điện thoại';
    } else if (!RegExp(r'^(0|84)[0-9]{9,10}$').hasMatch(phone)) {
      errors['phone'] = 'Số điện thoại không hợp lệ';
    }

    if (state.provinceId == null) {
      errors['provinceId'] = 'Vui lòng chọn tỉnh / thành phố';
    }
    if (state.districtId == null) {
      errors['districtId'] = 'Vui lòng chọn quận / huyện';
    }
    if (state.wardCode == null || state.wardCode!.isEmpty) {
      errors['wardCode'] = 'Vui lòng chọn phường / xã';
    }
    if (state.detailAddress.trim().isEmpty) {
      errors['detailAddress'] = 'Vui lòng nhập địa chỉ chi tiết';
    }

    return errors;
  }

  String _friendlySubmitError(String raw) {
    final lower = raw.toLowerCase();
    if (lower.contains('internal server error')) {
      return 'Có lỗi hệ thống khi lưu địa chỉ. Vui lòng thử lại sau.';
    }
    if (lower.contains('forbidden') || lower.contains('unauthorized')) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    if (lower.contains('network') || lower.contains('socket')) {
      return 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.';
    }
    return raw;
  }
}

final addressFormProvider = StateNotifierProvider.autoDispose
    .family<AddressFormNotifier, AddressFormState, Address?>((ref, address) {
      return AddressFormNotifier(ref: ref, initialAddress: address);
    });
