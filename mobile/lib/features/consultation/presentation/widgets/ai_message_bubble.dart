import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../cart/providers/cart_provider.dart';
import '../../models/chat_message.dart';
import '../../utils/time_formatter.dart';

class AiMessageBubble extends ConsumerStatefulWidget {
  final ChatMessage message;

  const AiMessageBubble({super.key, required this.message});

  @override
  ConsumerState<AiMessageBubble> createState() => _AiMessageBubbleState();
}

class _AiMessageBubbleState extends ConsumerState<AiMessageBubble> {
  bool? _reaction; // null = none, true = liked, false = disliked

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
                '✦',
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
                  decoration: const BoxDecoration(
                    color: AppTheme.creamWhite,
                    borderRadius: BorderRadius.only(
                      topRight: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                  ),
                  child: Text(
                    widget.message.text,
                    style: GoogleFonts.montserrat(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      height: 1.5,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                ),

                // Product Recommendation Cards
                if (widget.message.recommendations != null &&
                    widget.message.recommendations!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  ...widget.message.recommendations!.map(
                    (rec) => _RecommendationCard(rec: rec),
                  ),
                ],

                // Reactions + Timestamp
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      TimeFormatter.formatRelativeTime(
                        widget.message.timestamp,
                      ),
                      style: GoogleFonts.montserrat(
                        fontSize: 11,
                        fontWeight: FontWeight.w400,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                    const SizedBox(width: 12),
                    _ReactionBtn(
                      icon: Icons.thumb_up_outlined,
                      activeIcon: Icons.thumb_up_rounded,
                      isActive: _reaction == true,
                      onTap: () => setState(() {
                        _reaction = _reaction == true ? null : true;
                      }),
                    ),
                    const SizedBox(width: 4),
                    _ReactionBtn(
                      icon: Icons.thumb_down_outlined,
                      activeIcon: Icons.thumb_down_rounded,
                      isActive: _reaction == false,
                      onTap: () => setState(() {
                        _reaction = _reaction == false ? null : false;
                      }),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Reaction button
// ---------------------------------------------------------------------------

class _ReactionBtn extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final bool isActive;
  final VoidCallback onTap;

  const _ReactionBtn({
    required this.icon,
    required this.activeIcon,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: isActive
              ? AppTheme.accentGold.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(
          isActive ? activeIcon : icon,
          size: 16,
          color: isActive ? AppTheme.accentGold : AppTheme.mutedSilver,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Product Recommendation Card (rich: image, brand, price, tags, CTA)
// ---------------------------------------------------------------------------

class _RecommendationCard extends ConsumerWidget {
  final AiRecommendation rec;
  const _RecommendationCard({required this.rec});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.ivoryBackground,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image + Info row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image
              _ProductImage(url: rec.imageUrl),

              // Info
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (rec.brand.isNotEmpty)
                        Text(
                          rec.brand.toUpperCase(),
                          style: GoogleFonts.montserrat(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.8,
                            color: AppTheme.mutedSilver,
                          ),
                        ),
                      const SizedBox(height: 3),
                      Text(
                        rec.name,
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      if (rec.price > 0)
                        Text(
                          formatVND(rec.price),
                          style: GoogleFonts.montserrat(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.accentGold,
                          ),
                        ),
                      if (rec.tags.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: rec.tags
                              .take(3)
                              .map((tag) => _Tag(label: tag))
                              .toList(),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Reason
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: Text(
              rec.reason,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                color: AppTheme.mutedSilver,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          // CTA Buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
            child: Row(
              children: [
                // Add to Cart
                if (rec.variantId.isNotEmpty)
                  Expanded(
                    child: _CtaButton(
                      label: 'Thêm vào giỏ',
                      icon: Icons.shopping_bag_outlined,
                      filled: true,
                      onTap: () => _addToCart(context, ref),
                    ),
                  ),
                if (rec.variantId.isNotEmpty) const SizedBox(width: 8),
                // View Detail
                Expanded(
                  child: _CtaButton(
                    label: 'Xem chi tiết',
                    icon: Icons.visibility_outlined,
                    filled: false,
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/product/${rec.productId}');
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _addToCart(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(cartProvider.notifier).addItemByVariant(rec.variantId);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã thêm ${rec.name} vào giỏ hàng'),
            duration: const Duration(seconds: 2),
            backgroundColor: AppTheme.accentGold,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: const Color(0xFFFF453A),
          ),
        );
      }
    }
  }
}

class _ProductImage extends StatelessWidget {
  final String url;
  const _ProductImage({required this.url});

  @override
  Widget build(BuildContext context) {
    if (url.isNotEmpty) {
      return ClipRRect(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(14),
          bottomLeft: Radius.circular(14),
        ),
        child: Image.network(
          url,
          width: 80,
          height: 100,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _placeholder(),
        ),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() => Container(
    width: 80,
    height: 100,
    decoration: const BoxDecoration(
      color: Color(0xFFF5F1ED),
      borderRadius: BorderRadius.only(
        topLeft: Radius.circular(14),
        bottomLeft: Radius.circular(14),
      ),
    ),
    child: const Icon(
      Icons.spa_outlined,
      size: 28,
      color: AppTheme.mutedSilver,
    ),
  );
}

class _Tag extends StatelessWidget {
  final String label;
  const _Tag({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppTheme.accentGold.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: GoogleFonts.montserrat(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: AppTheme.accentGold,
        ),
      ),
    );
  }
}

class _CtaButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool filled;
  final VoidCallback onTap;

  const _CtaButton({
    required this.label,
    required this.icon,
    required this.filled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: filled ? AppTheme.accentGold : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: filled
              ? null
              : Border.all(color: AppTheme.accentGold.withValues(alpha: 0.5)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 14,
              color: filled ? AppTheme.primaryDb : AppTheme.accentGold,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: filled ? AppTheme.primaryDb : AppTheme.accentGold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
