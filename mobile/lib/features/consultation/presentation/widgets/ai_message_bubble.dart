import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../models/chat_message.dart';
import '../../utils/time_formatter.dart';
import 'chat_product_card.dart';

class AiMessageBubble extends StatelessWidget {
  final ChatMessage message;

  const AiMessageBubble({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // AI Avatar
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Text(
                'S',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.accentGold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Message Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Text Bubble
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.creamWhite,
                    borderRadius: const BorderRadius.only(
                      topRight: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                  ),
                  child: Text(
                    message.text,
                    style: GoogleFonts.montserrat(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      height: 1.5,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                ),

                // AI Recommendations list (from CUSTOMER_AI conversation)
                if (message.recommendations != null &&
                    message.recommendations!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  ...message.recommendations!.map(
                    (rec) => _AiRecommendationTile(rec: rec),
                  ),
                ],

                // Legacy single-product card (kept for backward compat)
                if (message.recommendations == null &&
                    message.productRecommendation != null) ...[
                  const SizedBox(height: 12),
                  ChatProductCard(product: message.productRecommendation!),
                ],

                // Timestamp
                const SizedBox(height: 4),
                Text(
                  TimeFormatter.formatRelativeTime(message.timestamp),
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AiRecommendationTile extends StatelessWidget {
  final AiRecommendation rec;
  const _AiRecommendationTile({required this.rec});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.ivoryBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.accentGold.withValues(alpha: 0.4),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.spa_outlined,
              size: 16,
              color: AppTheme.accentGold,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  rec.name,
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  rec.reason,
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    color: AppTheme.mutedSilver,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
