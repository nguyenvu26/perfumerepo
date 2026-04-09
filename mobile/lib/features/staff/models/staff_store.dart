/// A store the staff member is assigned to.
class StaffStore {
  final String id;
  final String name;
  final String? code;
  final String? address;

  const StaffStore({
    required this.id,
    required this.name,
    this.code,
    this.address,
  });

  factory StaffStore.fromJson(Map<String, dynamic> json) {
    return StaffStore(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String?,
      address: json['address'] as String?,
    );
  }
}
