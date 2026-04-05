import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../data/review_api_service.dart';
import '../models/review.dart';

final reviewApiServiceProvider = Provider<ReviewApiService>((ref) {
  final client = ref.watch(apiClientProvider);
  return ReviewApiService(client: client);
});

/// Full review list for a product (first page, 50 items).
final reviewListProvider = FutureProvider.family<ReviewListResponse, String>((
  ref,
  productId,
) async {
  final service = ref.watch(reviewApiServiceProvider);
  return service.getReviews(productId, skip: 0, take: 50);
});

/// Stats (average, total, distribution) for a product.
final reviewStatsProvider = FutureProvider.family<ReviewStats, String>((
  ref,
  productId,
) async {
  final service = ref.watch(reviewApiServiceProvider);
  return service.getStats(productId);
});

/// AI summary for a product (may be null if not generated yet).
final reviewSummaryProvider =
    FutureProvider.family<ReviewSummaryModel?, String>((ref, productId) async {
      final service = ref.watch(reviewApiServiceProvider);
      try {
        return await service.getSummary(productId);
      } catch (_) {
        return null;
      }
    });
