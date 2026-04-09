import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../models/review.dart';
import '../providers/review_provider.dart';

enum _ReviewFilter { all, withImages, verified }

class ReviewsScreen extends ConsumerStatefulWidget {
  final String productId;
  final String productName;

  const ReviewsScreen({
    super.key,
    required this.productId,
    required this.productName,
  });

  @override
  ConsumerState<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends ConsumerState<ReviewsScreen> {
  _ReviewFilter _activeFilter = _ReviewFilter.all;

  List<ReviewItem> _applyFilter(List<ReviewItem> items) {
    switch (_activeFilter) {
      case _ReviewFilter.withImages:
        return items.where((r) => r.images.isNotEmpty).toList();
      case _ReviewFilter.verified:
        return items.where((r) => r.isVerified).toList();
      case _ReviewFilter.all:
        return items;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inDays >= 365) {
      final y = (diff.inDays / 365).floor();
      return '$y năm trước';
    } else if (diff.inDays >= 30) {
      final m = (diff.inDays / 30).floor();
      return '$m tháng trước';
    } else if (diff.inDays >= 7) {
      final w = (diff.inDays / 7).floor();
      return '$w tuần trước';
    } else if (diff.inDays >= 1) {
      return '${diff.inDays} ngày trước';
    } else if (diff.inHours >= 1) {
      return '${diff.inHours} giờ trước';
    } else {
      return 'Vừa xong';
    }
  }

  @override
  Widget build(BuildContext context) {
    final statsAsync = ref.watch(reviewStatsProvider(widget.productId));
    final listAsync = ref.watch(reviewListProvider(widget.productId));
    final summaryAsync = ref.watch(reviewSummaryProvider(widget.productId));

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.deepCharcoal),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Đánh giá',
          style: GoogleFonts.playfairDisplay(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: AppTheme.deepCharcoal,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),

        children: [
          // ── AI Insight Card ──────────────────────────────────────
          summaryAsync.when(
            loading: () => _AiInsightCard(summary: ''),
            error: (_, __) => _AiInsightCard(summary: ''),
            data: (summary) {
              final text = summary?.summary ?? '';
              return _AiInsightCard(summary: text);
            },
          ),

          const SizedBox(height: 20),

          // ── Rating Summary ───────────────────────────────────────
          statsAsync.when(
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: CircularProgressIndicator(color: AppTheme.accentGold),
              ),
            ),
            error: (_, __) => const SizedBox.shrink(),
            data: (stats) => _RatingSummary(stats: stats),
          ),

          const SizedBox(height: 24),

          // ── Filter Tabs ──────────────────────────────────────────
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChipWidget(
                  label: 'Tất cả đánh giá',
                  isSelected: _activeFilter == _ReviewFilter.all,
                  onTap: () =>
                      setState(() => _activeFilter = _ReviewFilter.all),
                ),
                const SizedBox(width: 8),
                _FilterChipWidget(
                  label: 'Có hình ảnh',
                  isSelected: _activeFilter == _ReviewFilter.withImages,
                  onTap: () =>
                      setState(() => _activeFilter = _ReviewFilter.withImages),
                ),
                const SizedBox(width: 8),
                _FilterChipWidget(
                  label: 'Người mua xác thực',
                  isSelected: _activeFilter == _ReviewFilter.verified,
                  onTap: () =>
                      setState(() => _activeFilter = _ReviewFilter.verified),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ── Review List ─────────────────────────────────────────
          listAsync.when(
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: CircularProgressIndicator(color: AppTheme.accentGold),
              ),
            ),
            error: (e, _) => Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 48),
                child: Text(
                  'Không thể tải đánh giá',
                  style: GoogleFonts.montserrat(color: AppTheme.mutedSilver),
                ),
              ),
            ),
            data: (response) {
              final filtered = _applyFilter(response.items);
              if (filtered.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 48),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.rate_review_outlined,
                          size: 48,
                          color: AppTheme.mutedSilver,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Chưa có đánh giá nào',
                          style: GoogleFonts.montserrat(
                            color: AppTheme.mutedSilver,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }
              return Column(
                children: filtered
                    .map(
                      (review) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _ReviewCard(
                          review: review,
                          timeAgo: _timeAgo(review.createdAt),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// Sub-widgets
// ══════════════════════════════════════════════════════════════

class _AiInsightCard extends StatefulWidget {
  final String summary;
  const _AiInsightCard({required this.summary});

  @override
  State<_AiInsightCard> createState() => _AiInsightCardState();
}

class _AiInsightCardState extends State<_AiInsightCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final isEmpty = widget.summary.trim().isEmpty;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.accentGold.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: AppTheme.accentGold,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'GÓC NHÌN PERFUMEGPT',
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                    color: AppTheme.accentGold,
                  ),
                ),
                const SizedBox(height: 6),
                if (isEmpty)
                  Text(
                    'Chưa có tổng hợp AI cho sản phẩm này.',
                    style: GoogleFonts.montserrat(
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                      color: AppTheme.mutedSilver,
                    ),
                  )
                else
                  GestureDetector(
                    onTap: () => setState(() => _expanded = !_expanded),
                    child: Text(
                      widget.summary,
                      style: GoogleFonts.montserrat(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        height: 1.5,
                        color: AppTheme.deepCharcoal.withValues(alpha: 0.85),
                      ),
                      maxLines: _expanded ? null : 2,
                      overflow: _expanded
                          ? TextOverflow.visible
                          : TextOverflow.ellipsis,
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

class _RatingSummary extends StatelessWidget {
  final ReviewStats stats;
  const _RatingSummary({required this.stats});

  @override
  Widget build(BuildContext context) {
    if (stats.total == 0) {
      return Text(
        'Chưa có đánh giá nào cho sản phẩm này.',
        style: GoogleFonts.montserrat(
          fontSize: 13,
          color: AppTheme.mutedSilver,
        ),
      );
    }

    final starsFilled = stats.average.floor();
    final hasHalf = (stats.average - starsFilled) >= 0.5;
    return LayoutBuilder(
      builder: (context, constraints) {
        final isNarrow = constraints.maxWidth < 340;
        return isNarrow
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _RatingLeft(
                    stats: stats,
                    starsFilled: starsFilled,
                    hasHalf: hasHalf,
                  ),
                  const SizedBox(height: 16),
                  _RatingRight(stats: stats),
                ],
              )
            : Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _RatingLeft(
                    stats: stats,
                    starsFilled: starsFilled,
                    hasHalf: hasHalf,
                  ),
                  const SizedBox(width: 24),
                  Expanded(child: _RatingRight(stats: stats)),
                ],
              );
      },
    );
  }
}

class _RatingLeft extends StatelessWidget {
  final ReviewStats stats;
  final int starsFilled;
  final bool hasHalf;
  const _RatingLeft({
    required this.stats,
    required this.starsFilled,
    required this.hasHalf,
  });
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          stats.average.toStringAsFixed(1),
          style: GoogleFonts.playfairDisplay(
            fontSize: 64,
            fontWeight: FontWeight.w600,
            color: AppTheme.deepCharcoal,
            height: 1,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(5, (i) {
            if (i < starsFilled) {
              return const Icon(
                Icons.star,
                color: AppTheme.accentGold,
                size: 18,
              );
            } else if (i == starsFilled && hasHalf) {
              return const Icon(
                Icons.star_half,
                color: AppTheme.accentGold,
                size: 18,
              );
            } else {
              return const Icon(
                Icons.star_border,
                color: AppTheme.accentGold,
                size: 18,
              );
            }
          }),
        ),
        const SizedBox(height: 6),
        Text(
          '${stats.total} đánh giá đã xác thực',
          style: GoogleFonts.montserrat(
            fontSize: 11,
            color: AppTheme.mutedSilver,
          ),
        ),
      ],
    );
  }
}

class _RatingRight extends StatelessWidget {
  final ReviewStats stats;
  const _RatingRight({required this.stats});
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [5, 4, 3, 2, 1].map((star) {
        final count = stats.distribution[star] ?? 0;
        final ratio = stats.total > 0 ? count / stats.total : 0.0;
        return Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            children: [
              Text(
                '$star',
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  color: AppTheme.mutedSilver,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.star, size: 10, color: AppTheme.accentGold),
              const SizedBox(width: 6),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: ratio.toDouble(),
                    minHeight: 6,
                    backgroundColor: AppTheme.softTaupe.withValues(alpha: 0.3),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppTheme.accentGold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '$count',
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  color: AppTheme.mutedSilver,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _FilterChipWidget extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChipWidget({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryDb : AppTheme.creamWhite,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primaryDb : AppTheme.softTaupe,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.montserrat(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? AppTheme.creamWhite : AppTheme.deepCharcoal,
          ),
        ),
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final ReviewItem review;
  final String timeAgo;

  const _ReviewCard({required this.review, required this.timeAgo});

  @override
  Widget build(BuildContext context) {
    final name = review.user.fullName;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: avatar + name/meta + stars
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.softTaupe.withValues(alpha: 0.4),
                backgroundImage: review.user.avatarUrl != null
                    ? NetworkImage(review.user.avatarUrl!)
                    : null,
                child: review.user.avatarUrl == null
                    ? Text(
                        initial,
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.accentGold,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 6,
                      children: [
                        Text(
                          timeAgo,
                          style: GoogleFonts.montserrat(
                            fontSize: 10,
                            color: AppTheme.mutedSilver,
                          ),
                        ),
                        if (review.isVerified) ...[
                          const Text(
                            '•',
                            style: TextStyle(
                              fontSize: 10,
                              color: AppTheme.mutedSilver,
                            ),
                          ),
                          Text(
                            'Người mua xác thực',
                            style: GoogleFonts.montserrat(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.accentGold,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < review.rating ? Icons.star : Icons.star_border,
                    color: AppTheme.accentGold,
                    size: 14,
                  ),
                ),
              ),
            ],
          ),

          // Content
          if (review.content != null && review.content!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              review.content!,
              style: GoogleFonts.montserrat(
                fontSize: 13,
                fontWeight: FontWeight.w400,
                height: 1.6,
                color: AppTheme.deepCharcoal,
              ),
            ),
          ],

          // Images
          if (review.images.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: review.images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) => ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    review.images[i].imageUrl,
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 100,
                      height: 100,
                      color: AppTheme.softTaupe.withValues(alpha: 0.3),
                      child: const Icon(
                        Icons.image_outlined,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],

          // Helpful
          if (review.helpfulCount > 0) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(
                  Icons.favorite_border,
                  size: 14,
                  color: AppTheme.mutedSilver,
                ),
                const SizedBox(width: 4),
                Text(
                  '${review.helpfulCount} người thấy hữu ích',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
