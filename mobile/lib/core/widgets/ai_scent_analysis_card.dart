import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class AIScentAnalysisCard extends StatelessWidget {
  final bool isExpanded;
  final VoidCallback onToggle;
  final List<String> notes;

  const AIScentAnalysisCard({
    super.key,
    required this.isExpanded,
    required this.onToggle,
    required this.notes,
  });

  @override
  Widget build(BuildContext context) {
    final highlightNote = notes.isNotEmpty ? notes.first : 'floral';

    return Transform.translate(
      offset: const Offset(0, -30),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
        child: GestureDetector(
          onTap: onToggle,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppTheme.accentGold.withValues(alpha: 0.15),
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: AppTheme.accentGold.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.auto_awesome,
                        size: 16,
                        color: AppTheme.accentGold,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'AI Scent Analysis',
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                    ),
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOutCubic,
                      child: const Icon(
                        Icons.keyboard_arrow_down,
                        size: 20,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                  ],
                ),
                AnimatedCrossFade(
                  firstChild: const SizedBox.shrink(),
                  secondChild: Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: RichText(
                      text: TextSpan(
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          height: 1.5,
                          color: AppTheme.deepCharcoal.withValues(alpha: 0.8),
                        ),
                        children: [
                          const TextSpan(
                            text:
                                'We chose this for you based on your recent love for ',
                          ),
                          TextSpan(
                            text: highlightNote.toLowerCase(),
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppTheme.accentGold,
                            ),
                          ),
                          const TextSpan(
                            text:
                                ' notes. The intensified heart note perfectly matches your preference for creamy, long-lasting trails.',
                          ),
                        ],
                      ),
                    ),
                  ),
                  crossFadeState: isExpanded
                      ? CrossFadeState.showSecond
                      : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 280),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
