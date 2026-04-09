import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../services/profile_service.dart';

/// Handles the async "save profile" operation for the edit screen.
///
/// On success it re-injects the updated profile into [authStateProvider]'s
/// cache so that [userProfileProvider] and [profileProvider] both refresh
/// automatically without an extra network round-trip.
class ProfileEditNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> save({
    required String fullName,
    required String phone,
    String? gender,
    String? dateOfBirth,
  }) async {
    state = const AsyncLoading();
    try {
      final service = ref.read(profileServiceProvider);
      final updated = await service.updateMe(
        fullName: fullName.trim().isEmpty ? null : fullName.trim(),
        phone: phone.trim().isEmpty ? null : phone.trim(),
        gender: gender,
        dateOfBirth: dateOfBirth,
      );

      // Push the fresh data back into the auth cache so that every provider
      // that watches userProfileProvider automatically rebuilds.
      ref.read(authStateProvider.notifier).markAuthenticated(profile: updated);

      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }
}

final profileEditProvider = AsyncNotifierProvider<ProfileEditNotifier, void>(
  ProfileEditNotifier.new,
);
