import 'package:flutter_test/flutter_test.dart';
import 'package:perfume_gpt_app/features/profile/models/user_profile.dart';

/// Example test file for UserProfile model.
/// Demonstrates how models can be tested independently.
void main() {
  group('UserProfile', () {
    test('creates profile from JSON', () {
      final json = {
        'id': 'user-123',
        'full_name': 'Elena Fisher',
        'email': 'elena@example.com',
        'avatar_url': 'https://example.com/avatar.jpg',
        'created_at': '2023-01-15T10:00:00Z',
        'olfactory_tags': ['Woody', 'Citrus', 'Bergamot'],
        'has_ai_profile': true,
      };

      final profile = UserProfile.fromJson(json);

      expect(profile.id, 'user-123');
      expect(profile.name, 'Elena Fisher');
      expect(profile.email, 'elena@example.com');
      expect(profile.avatarUrl, 'https://example.com/avatar.jpg');
      expect(profile.olfactoryTags, ['Woody', 'Citrus', 'Bergamot']);
      expect(profile.hasAiProfile, isTrue);
    });

    test('generates correct memberSinceText', () {
      final profile = UserProfile(
        id: 'user-123',
        name: 'Elena Fisher',
        email: 'elena@example.com',
        memberSince: DateTime(2023, 1, 15),
      );

      expect(profile.memberSinceText, 'Member since 2023');
    });

    test('handles missing optional fields', () {
      final json = {
        'id': 'user-123',
        'email': 'elena@example.com',
      };

      final profile = UserProfile.fromJson(json);

      expect(profile.id, 'user-123');
      expect(profile.name, 'User'); // Default fallback
      expect(profile.email, 'elena@example.com');
      expect(profile.avatarUrl, isNull);
      expect(profile.olfactoryTags, isEmpty);
      expect(profile.hasAiProfile, isFalse);
    });

    test('converts to JSON correctly', () {
      final profile = UserProfile(
        id: 'user-123',
        name: 'Elena Fisher',
        email: 'elena@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberSince: DateTime(2023, 1, 15),
        olfactoryTags: ['Woody', 'Citrus'],
        hasAiProfile: true,
      );

      final json = profile.toJson();

      expect(json['id'], 'user-123');
      expect(json['full_name'], 'Elena Fisher');
      expect(json['email'], 'elena@example.com');
      expect(json['avatar_url'], 'https://example.com/avatar.jpg');
      expect(json['olfactory_tags'], ['Woody', 'Citrus']);
      expect(json['has_ai_profile'], isTrue);
    });
  });
}
