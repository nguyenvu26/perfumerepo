class GhnProvince {
  final int id;
  final String name;

  const GhnProvince({required this.id, required this.name});

  factory GhnProvince.fromJson(Map<String, dynamic> json) {
    return GhnProvince(
      id: _readInt(json['ProvinceID'] ?? json['id']),
      name: (json['ProvinceName'] ?? json['name'] ?? '').toString(),
    );
  }
}

class GhnDistrict {
  final int id;
  final String name;

  const GhnDistrict({required this.id, required this.name});

  factory GhnDistrict.fromJson(Map<String, dynamic> json) {
    return GhnDistrict(
      id: _readInt(json['DistrictID'] ?? json['id']),
      name: (json['DistrictName'] ?? json['name'] ?? '').toString(),
    );
  }
}

class GhnWard {
  final String code;
  final String name;

  const GhnWard({required this.code, required this.name});

  factory GhnWard.fromJson(Map<String, dynamic> json) {
    return GhnWard(
      code: (json['WardCode'] ?? json['code'] ?? '').toString(),
      name: (json['WardName'] ?? json['name'] ?? '').toString(),
    );
  }
}

class GhnServiceOption {
  final int id;
  final String name;

  const GhnServiceOption({required this.id, required this.name});

  factory GhnServiceOption.fromJson(Map<String, dynamic> json) {
    return GhnServiceOption(
      id: _readInt(json['service_id'] ?? json['id']),
      name: (json['short_name'] ?? json['name'] ?? '').toString(),
    );
  }
}

int _readInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
