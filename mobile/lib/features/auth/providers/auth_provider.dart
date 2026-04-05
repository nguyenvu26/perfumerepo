import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';

class AuthUser {
  final String id;
  final String? email;
  final String createdAt;

  const AuthUser({
    required this.id,
    required this.email,
    required this.createdAt,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: (json['id'] ?? json['_id'] ?? '') as String,
      email: json['email'] as String?,
      createdAt:
          (json['created_at'] ??
                  json['createdAt'] ??
                  DateTime.now().toIso8601String())
              as String,
    );
  }
}

final _authUserStateProvider = StateProvider<AuthUser?>((ref) => null);
final _authProfileStateProvider = StateProvider<Map<String, dynamic>?>(
  (ref) => null,
);

class AuthStatusNotifier extends StateNotifier<bool> {
  final Ref _ref;
  final AuthRepository _repository;

  AuthStatusNotifier({required Ref ref, required AuthRepository repository})
    : _ref = ref,
      _repository = repository,
      super(false) {
    _bootstrapAuthState();
  }

  Future<void> _bootstrapAuthState() async {
    final hasToken = await _repository.isAuthenticated;
    if (!hasToken) {
      state = false;
      return;
    }

    try {
      final profile = await _repository.getProfile();
      _ref.read(_authProfileStateProvider.notifier).state = profile;
      _ref.read(_authUserStateProvider.notifier).state = AuthUser.fromJson(
        profile,
      );
      state = true;
    } catch (_) {
      await _repository.logout();
      clearAuthMemory();
      state = false;
    }
  }

  void markAuthenticated({Map<String, dynamic>? profile}) {
    if (profile != null) {
      _ref.read(_authProfileStateProvider.notifier).state = profile;
      _ref.read(_authUserStateProvider.notifier).state = AuthUser.fromJson(
        profile,
      );
    }
    state = true;
  }

  void clearAuthMemory() {
    _ref.read(_authUserStateProvider.notifier).state = null;
    _ref.read(_authProfileStateProvider.notifier).state = null;
  }

  void markLoggedOut() {
    clearAuthMemory();
    state = false;
  }
}

/// Authentication status used by router guard.
///
/// `true`  => user has valid login session
/// `false` => user is logged out
final authStateProvider = StateNotifierProvider<AuthStatusNotifier, bool>((
  ref,
) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthStatusNotifier(ref: ref, repository: repository);
});

/// Current authenticated user information.
final currentUserProvider = Provider<AuthUser?>((ref) {
  return ref.watch(_authUserStateProvider);
});

/// Synchronous access to cached profile data (used by router guard for role check).
final userProfileRawProvider = Provider<Map<String, dynamic>?>((ref) {
  return ref.watch(_authProfileStateProvider);
});

/// Full profile payload returned by `/auth/profile`.
final userProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final isAuthenticated = ref.watch(authStateProvider);
  if (!isAuthenticated) return null;

  final cachedProfile = ref.watch(_authProfileStateProvider);
  if (cachedProfile != null) return cachedProfile;

  final repository = ref.watch(authRepositoryProvider);
  final profile = await repository.getProfile();
  ref.read(_authProfileStateProvider.notifier).state = profile;

  final currentUser = ref.read(_authUserStateProvider);
  if (currentUser == null) {
    ref.read(_authUserStateProvider.notifier).state = AuthUser.fromJson(
      profile,
    );
  }

  return profile;
});

class AuthNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref _ref;
  final AuthRepository _repository;

  AuthNotifier({required Ref ref, required AuthRepository repository})
    : _ref = ref,
      _repository = repository,
      super(const AsyncValue.data(null));

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      await _repository.login(email: email, password: password);

      Map<String, dynamic>? profile;
      try {
        profile = await _repository.getProfile();
      } catch (_) {
        // Keep authenticated if login succeeded and token was stored.
      }

      _ref.read(authStateProvider.notifier).markAuthenticated(profile: profile);
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _repository.register(
        email: email,
        password: password,
        fullName: fullName,
        phone: phone,
      );

      final hasToken = await _repository.isAuthenticated;
      if (hasToken) {
        Map<String, dynamic>? profile;
        try {
          profile = await _repository.getProfile();
        } catch (_) {
          // Registration can be successful even if profile endpoint is not ready.
        }
        _ref
            .read(authStateProvider.notifier)
            .markAuthenticated(profile: profile);
      }

      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    state = AsyncValue.error(
      UnsupportedError(
        'Google OAuth is not implemented in NestJS REST auth flow.',
      ),
      StackTrace.current,
    );
  }

  Future<void> signInWithFacebook() async {
    state = const AsyncValue.loading();
    state = AsyncValue.error(
      UnsupportedError(
        'Facebook OAuth is not implemented in NestJS REST auth flow.',
      ),
      StackTrace.current,
    );
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      await _repository.logout();
      _ref.read(authStateProvider.notifier).markLoggedOut();
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

/// Auth controller used by existing login/register screens.
final authControllerProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<void>>((ref) {
      final repository = ref.watch(authRepositoryProvider);
      return AuthNotifier(ref: ref, repository: repository);
    });
