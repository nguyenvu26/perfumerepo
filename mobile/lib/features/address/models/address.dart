enum AddressLabel { home, office, gift }

extension AddressLabelX on AddressLabel {
  String get displayName {
    switch (this) {
      case AddressLabel.home:
        return 'Nhà riêng';
      case AddressLabel.office:
        return 'Văn phòng';
      case AddressLabel.gift:
        return 'Quà tặng';
    }
  }

  static AddressLabel fromRaw(String? raw) {
    final value = (raw ?? '').trim().toLowerCase();
    if (value.contains('van')) return AddressLabel.office;
    if (value.contains('qua')) return AddressLabel.gift;
    return AddressLabel.home;
  }
}

class Address {
  final String id;
  final AddressLabel label;
  final String recipientName;
  final String phone;
  final String detailAddress;
  final String fullAddress;
  final int provinceId;
  final String provinceName;
  final int districtId;
  final String districtName;
  final String wardCode;
  final String wardName;
  final int serviceId;
  final bool isDefault;
  final String? note;

  const Address({
    required this.id,
    required this.label,
    required this.recipientName,
    required this.phone,
    required this.detailAddress,
    required this.fullAddress,
    required this.provinceId,
    required this.provinceName,
    required this.districtId,
    required this.districtName,
    required this.wardCode,
    required this.wardName,
    required this.serviceId,
    required this.isDefault,
    this.note,
  });

  Address copyWith({
    String? id,
    AddressLabel? label,
    String? recipientName,
    String? phone,
    String? detailAddress,
    String? fullAddress,
    int? provinceId,
    String? provinceName,
    int? districtId,
    String? districtName,
    String? wardCode,
    String? wardName,
    int? serviceId,
    bool? isDefault,
    String? note,
  }) {
    return Address(
      id: id ?? this.id,
      label: label ?? this.label,
      recipientName: recipientName ?? this.recipientName,
      phone: phone ?? this.phone,
      detailAddress: detailAddress ?? this.detailAddress,
      fullAddress: fullAddress ?? this.fullAddress,
      provinceId: provinceId ?? this.provinceId,
      provinceName: provinceName ?? this.provinceName,
      districtId: districtId ?? this.districtId,
      districtName: districtName ?? this.districtName,
      wardCode: wardCode ?? this.wardCode,
      wardName: wardName ?? this.wardName,
      serviceId: serviceId ?? this.serviceId,
      isDefault: isDefault ?? this.isDefault,
      note: note ?? this.note,
    );
  }

  factory Address.fromJson(Map<String, dynamic> json) {
    final detailAddress =
        (json['detailAddress'] ?? json['fullAddress'] ?? json['address'] ?? '')
            .toString();
    final provinceName = (json['provinceName'] ?? '').toString();
    final districtName = (json['districtName'] ?? '').toString();
    final wardName = (json['wardName'] ?? '').toString();

    final fullAddress = detailAddress.isEmpty
        ? ''
        : [
            detailAddress,
            wardName,
            districtName,
            provinceName,
          ].where((part) => part.trim().isNotEmpty).join(', ');

    return Address(
      id: (json['id'] ?? '').toString(),
      label: AddressLabelX.fromRaw(
        (json['label'] ?? json['type'] ?? json['tag'])?.toString(),
      ),
      recipientName: (json['recipientName'] ?? json['name'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      detailAddress: detailAddress,
      fullAddress: fullAddress,
      provinceId: _readInt(json['provinceId'] ?? json['shippingProvinceId']),
      provinceName: provinceName,
      districtId: _readInt(json['districtId'] ?? json['shippingDistrictId']),
      districtName: districtName,
      wardCode: (json['wardCode'] ?? json['shippingWardCode'] ?? '').toString(),
      wardName: wardName,
      serviceId: _readInt(json['serviceId'] ?? json['shippingServiceId']),
      isDefault: (json['isDefault'] ?? false) == true,
      note: json['note']?.toString(),
    );
  }

  Map<String, dynamic> toApiPayload() {
    // Keep payload aligned with backend DTO (CreateAddressDto / UpdateAddressDto).
    return {
      'recipientName': recipientName,
      'phone': phone,
      'detailAddress': detailAddress,
      'provinceId': provinceId,
      'provinceName': provinceName,
      'districtId': districtId,
      'districtName': districtName,
      'wardCode': wardCode,
      'wardName': wardName,
      'isDefault': isDefault,
    };
  }
}

int _readInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
