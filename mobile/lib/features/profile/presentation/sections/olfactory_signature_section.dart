import 'package:flutter/material.dart';
import '../widgets/ai_insight_card.dart';

/// Olfactory Signature Section
///
/// Wrapper section for AI insight card with proper spacing.
///
/// Why this is a section:
/// - Provides consistent spacing around AI card
/// - Makes it easy to add/remove card from profile
/// - Separates AI feature presentation from profile layout
class OlfactorySignatureSection extends StatelessWidget {
  final List<String> olfactoryTags;
  final VoidCallback onFindNextScent;
  final VoidCallback onViewScentProfile;

  const OlfactorySignatureSection({
    super.key,
    required this.olfactoryTags,
    required this.onFindNextScent,
    required this.onViewScentProfile,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: AiInsightCard(
        olfactoryTags: olfactoryTags,
        onFindNextScent: onFindNextScent,
        onViewScentProfile: onViewScentProfile,
      ),
    );
  }
}
