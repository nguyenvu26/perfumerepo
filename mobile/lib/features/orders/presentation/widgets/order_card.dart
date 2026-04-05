import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_text_style.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../models/order.dart';
import 'order_status_badge.dart';

enum OrderCardVariant { active, completed }

class OrderCard extends StatelessWidget {
  final Order order;
  final OrderCardVariant variant;
  final VoidCallback onTap;
  final VoidCallback? onTrack;
  final VoidCallback? onReview;
  final VoidCallback? onViewDetail;
  final bool isReviewed;

  const OrderCard({
    super.key,
    required this.order,
    required this.variant,
    required this.onTap,
    this.onTrack,
    this.onReview,
    this.onViewDetail,
    this.isReviewed = false,
  });

  @override
  Widget build(BuildContext context) {
    final previewItem = order.previewItem;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: variant == OrderCardVariant.active
                    ? AppTheme.accentGold.withValues(alpha: 0.4)
                    : AppTheme.softTaupe,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      OrderStatusBadge(status: order.status),
                      const Spacer(),
                      Text(
                        _formatDate(order.createdAt),
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    order.code,
                    style: AppTextStyle.titleMd(color: AppTheme.deepCharcoal),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _ProductImage(
                        url: previewItem?.productImage ?? '',
                        productId: previewItem?.productId ?? '',
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              previewItem?.productName ?? 'Perfume item',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTextStyle.titleMd(
                                color: AppTheme.deepCharcoal,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              (previewItem?.variantLabel.isNotEmpty ?? false)
                                  ? previewItem!.variantLabel
                                  : 'Luxury fragrance',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${order.itemCount} sản phẩm • ${formatVND(order.finalAmount)}',
                              style: AppTextStyle.priceSm(
                                color: AppTheme.accentGold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _buildCtaRow(context),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCtaRow(BuildContext context) {
    final showTrack = variant == OrderCardVariant.active && onTrack != null;
    final isCancelled = order.status == OrderStatus.cancelled;
    final ctaLabel = showTrack
        ? 'Theo dõi'
        : isCancelled
        ? 'Xem chi tiết'
        : isReviewed
        ? 'Đã đánh giá'
        : 'Đánh giá';

    return Row(
      children: [
        TextButton(
          onPressed: onViewDetail ?? onTap,
          child: const Text('Xem chi tiết'),
        ),
        const Spacer(),
        ElevatedButton(
          onPressed: isReviewed
              ? null
              : showTrack
              ? onTrack
              : (isCancelled ? onViewDetail : onReview),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            disabledBackgroundColor: AppTheme.softTaupe,
            disabledForegroundColor: AppTheme.mutedSilver,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isReviewed) ...[
                const Icon(Icons.check_circle, size: 16),
                const SizedBox(width: 4),
              ],
              Text(ctaLabel),
            ],
          ),
        ),
      ],
    );
  }
}

class _ProductImage extends StatelessWidget {
  final String url;
  final String productId;

  const _ProductImage({required this.url, required this.productId});

  @override
  Widget build(BuildContext context) {
    final image = Container(
      width: 88,
      height: 88,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.35)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.accentGold.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: url.isEmpty
            ? const Center(
                child: Icon(
                  Icons.inventory_2_outlined,
                  size: 32,
                  color: AppTheme.softTaupe,
                ),
              )
            : Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Center(
                  child: Icon(
                    Icons.inventory_2_outlined,
                    size: 32,
                    color: AppTheme.softTaupe,
                  ),
                ),
              ),
      ),
    );

    if (productId.isEmpty) return image;

    return GestureDetector(
      onTap: () => context.push(AppRoutes.productDetailWithId(productId)),
      child: image,
    );
  }
}

String _formatDate(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  return '$day/$month/${date.year}';
}
