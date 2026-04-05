import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/user_profile.dart';

/// Profile State Provider
///
/// Combines auth user data with profile-specific information.
/// Returns null if user is not authenticated.
final profileProvider = FutureProvider<UserProfile?>((ref) async {
  final user = ref.watch(currentUserProvider);
  final profileData = await ref.watch(userProfileProvider.future);

  if (user == null || profileData == null) {
    return null;
  }

  // Merge user and profile data
  return UserProfile.fromJson({
    'id': user.id,
    'email': user.email ?? '',
    'full_name':
        profileData['full_name'] ??
        profileData['fullName'] ??
        profileData['name'],
    'avatar_url': profileData['avatar_url'] ?? profileData['avatarUrl'],
    'created_at':
        profileData['created_at'] ?? profileData['createdAt'] ?? user.createdAt,
    'olfactory_tags':
        profileData['olfactory_tags'] ??
        profileData['olfactoryTags'] ??
        ['Woody', 'Citrus', 'Bergamot'],
    'has_ai_profile':
        profileData['has_ai_profile'] ?? profileData['hasAiProfile'] ?? true,
  });
});

/// Profile Actions Notifier
///
/// Handles profile-related actions like editing and navigation
class ProfileNotifier extends StateNotifier<AsyncValue<void>> {
  ProfileNotifier() : super(const AsyncValue.data(null));

  Future<void> editProfile() async {
    // TODO: Navigate to edit profile screen
    state = const AsyncValue.loading();
    await Future.delayed(const Duration(milliseconds: 300));
    state = const AsyncValue.data(null);
  }

  Future<void> viewScentProfile() async {
    // TODO: Navigate to full scent profile
    state = const AsyncValue.loading();
    await Future.delayed(const Duration(milliseconds: 300));
    state = const AsyncValue.data(null);
  }

  Future<void> findNextScent() async {
    // TODO: Navigate to AI consultation
    state = const AsyncValue.loading();
    await Future.delayed(const Duration(milliseconds: 300));
    state = const AsyncValue.data(null);
  }
}

final profileNotifierProvider =
    StateNotifierProvider<ProfileNotifier, AsyncValue<void>>((ref) {
      return ProfileNotifier();
    });
