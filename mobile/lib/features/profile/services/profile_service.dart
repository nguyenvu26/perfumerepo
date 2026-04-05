import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

/// Service layer for PATCH /users/me and GET /users/me
class ProfileService {
  final ApiClient _apiClient;

  const ProfileService(this._apiClient);

  /// Fetch full user profile from the backend (richer than /auth/profile).
  Future<Map<String, dynamic>> getMe() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/users/me');
    return response.data!;
  }

  /// Update mutable profile fields.
  ///
  /// Only non-null values are sent to the backend, so callers can pass only
  /// the fields they want to change.
  Future<Map<String, dynamic>> updateMe({
    String? fullName,
    String? phone,
    String? gender,
    String? dateOfBirth,
  }) async {
    final body = <String, dynamic>{};
    if (fullName != null) body['fullName'] = fullName;
    if (phone != null) body['phone'] = phone;
    if (gender != null) body['gender'] = gender;
    if (dateOfBirth != null) body['dateOfBirth'] = dateOfBirth;

    final response = await _apiClient.patch<Map<String, dynamic>>(
      '/users/me',
      data: body,
    );
    return response.data!;
  }
}

final profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService(ref.read(apiClientProvider));
});
