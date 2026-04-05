/// User Profile Model
///
/// Represents the user's profile data including personal info,
/// membership status, and AI-generated olfactory preferences.
class UserProfile {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? gender;
  final DateTime? dateOfBirth;
  final String? avatarUrl;
  final DateTime memberSince;
  final List<String> olfactoryTags;
  final bool hasAiProfile;

  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.gender,
    this.dateOfBirth,
    this.avatarUrl,
    required this.memberSince,
    this.olfactoryTags = const [],
    this.hasAiProfile = false,
  });

  String get memberSinceText {
    return 'Thành viên từ ${memberSince.year}';
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final id = (json['id'] ?? json['_id'] ?? '') as String;
    final name =
        (json['full_name'] ?? json['fullName'] ?? json['name'] ?? 'Người dùng')
            as String;
    final email = (json['email'] ?? '') as String;
    final phone = (json['phone']) as String?;
    final gender = (json['gender']) as String?;
    final dobStr = (json['date_of_birth'] ?? json['dateOfBirth']) as String?;
    final dateOfBirth = dobStr != null ? DateTime.tryParse(dobStr) : null;
    final avatarUrl = (json['avatar_url'] ?? json['avatarUrl']) as String?;
    final createdAtStr = (json['created_at'] ?? json['createdAt']) as String?;
    final memberSince = createdAtStr != null
        ? DateTime.tryParse(createdAtStr) ?? DateTime.now()
        : DateTime.now();
    final olfactoryTags =
        (json['olfactory_tags'] as List?)?.cast<String>() ??
        (json['olfactoryTags'] as List?)?.cast<String>() ??
        [];
    final hasAiProfile =
        (json['has_ai_profile'] as bool?) ??
        (json['hasAiProfile'] as bool?) ??
        false;

    return UserProfile(
      id: id,
      name: name,
      email: email,
      phone: phone,
      gender: gender,
      dateOfBirth: dateOfBirth,
      avatarUrl: avatarUrl,
      memberSince: memberSince,
      olfactoryTags: olfactoryTags,
      hasAiProfile: hasAiProfile,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': name,
      'email': email,
      'phone': phone,
      'gender': gender,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'avatar_url': avatarUrl,
      'created_at': memberSince.toIso8601String(),
      'olfactory_tags': olfactoryTags,
      'has_ai_profile': hasAiProfile,
    };
  }
}
