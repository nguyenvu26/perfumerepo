import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:perfume_gpt_app/features/profile/presentation/widgets/profile_action_tile.dart';

/// Example test file demonstrating how the refactored components
/// can be tested independently.
/// 
/// This is a reference implementation - actual tests may vary.
void main() {
  group('ProfileActionTile', () {
    testWidgets('displays icon, title, and chevron', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProfileActionTile(
              icon: Icons.shopping_bag_outlined,
              title: 'My Orders',
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.shopping_bag_outlined), findsOneWidget);
      expect(find.text('My Orders'), findsOneWidget);
      expect(find.byIcon(Icons.arrow_forward_ios), findsOneWidget);
    });

    testWidgets('displays subtitle when provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProfileActionTile(
              icon: Icons.shopping_bag_outlined,
              title: 'My Orders',
              subtitle: '2 active shipments',
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('2 active shipments'), findsOneWidget);
    });

    testWidgets('calls onTap when tapped', (tester) async {
      var tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProfileActionTile(
              icon: Icons.shopping_bag_outlined,
              title: 'My Orders',
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ProfileActionTile));
      expect(tapped, isTrue);
    });

    testWidgets('has correct layout structure', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProfileActionTile(
              icon: Icons.shopping_bag_outlined,
              title: 'My Orders',
              subtitle: '2 active shipments',
              onTap: () {},
            ),
          ),
        ),
      );

      // Find the Material InkWell
      expect(find.byType(InkWell), findsOneWidget);

      // Find icon container
      final iconContainers = find.byType(Container);
      expect(iconContainers, findsWidgets);

      // Find text column
      final columns = find.byType(Column);
      expect(columns, findsWidgets);
    });
  });
}
