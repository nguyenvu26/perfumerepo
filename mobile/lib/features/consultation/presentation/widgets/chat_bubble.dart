import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../models/chat_message.dart';
import '../../utils/time_formatter.dart';
import 'chat_product_card.dart';

enum ChatRole { user, ai }

/// Enhanced chat bubble supporting both user and AI messages,
/// with status indicators, retry, and product recommendations.
class ChatBubble extends StatelessWidget {
  final ChatRole role;
  final ChatMessage message;
  final MessageStatus? status;
  final VoidCallback? onRetry;

  const ChatBubble({
    super.key,
    required this.role,
    required this.message,
    this.status,
    this.onRetry,
  });

  bool get _isAi => role == ChatRole.ai;
  bool get _isFailed => status == MessageStatus.failed;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: 16,
        left: _isAi ? 0 : 48,
        right: _isAi ? 48 : 0,
      ),
      child: _isAi ? _buildAiBubble(context) : _buildUserBubble(context),
    );
  }

  Widget _buildAiBubble(BuildContext context) {
    return Row(
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
              _bubbleContainer(
                color: AppTheme.creamWhite,
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),

              // Product Recommendation
              if (message.productRecommendation != null) ...[
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
    );
  }

  Widget _buildUserBubble(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _bubbleContainer(
          color: AppTheme.accentGold.withValues(alpha: 0.15),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
            bottomLeft: Radius.circular(16),
          ),
        ),

        const SizedBox(height: 4),

        // Timestamp + status
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_isFailed) ...[
              GestureDetector(
                onTap: onRetry,
                child: Icon(
                  Icons.refresh,
                  size: 14,
                  color: Colors.red.shade400,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                'Gửi lại',
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Colors.red.shade400,
                ),
              ),
              const SizedBox(width: 8),
            ],
            Text(
              TimeFormatter.formatRelativeTime(message.timestamp),
              style: GoogleFonts.montserrat(
                fontSize: 11,
                fontWeight: FontWeight.w400,
                color: AppTheme.mutedSilver,
              ),
            ),
            if (status == MessageStatus.sending) ...[
              const SizedBox(width: 4),
              SizedBox(
                width: 10,
                height: 10,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  color: AppTheme.mutedSilver,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _bubbleContainer({
    required Color color,
    required BorderRadius borderRadius,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _isFailed ? Colors.red.shade50 : color,
        borderRadius: borderRadius,
        border: _isFailed ? Border.all(color: Colors.red.shade200) : null,
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
    );
  }
}

/// Message delivery status.
enum MessageStatus { sending, sent, failed }
