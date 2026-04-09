import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/review.dart';

class ReviewApiService {
  final ApiClient _client;

  ReviewApiService({required ApiClient client}) : _client = client;

  /// POST /reviews
  Future<void> createReview({
    required String productId,
    required int orderItemId,
    required int rating,
    String? content,
    List<String>? images,
  }) async {
    final body = <String, dynamic>{
      'productId': productId,
      'orderItemId': orderItemId,
      'rating': rating,
    };
    if (content != null && content.trim().isNotEmpty) {
      body['content'] = content.trim();
    }
    if (images != null && images.isNotEmpty) {
      body['images'] = images;
    }
    await _client.post(ApiEndpoints.createReview, data: body);
  }

  /// POST /reviews/upload-images  (multipart, up to 5 files)
  Future<List<String>> uploadImages(List<String> filePaths) async {
    final formData = FormData();
    for (final path in filePaths) {
      final fileName = path.split(RegExp(r'[/\\]')).last;
      final ext = fileName.split('.').last.toLowerCase();
      final mimeType = _mimeFromExt(ext);
      formData.files.add(
        MapEntry(
          'images',
          await MultipartFile.fromFile(
            path,
            filename: fileName,
            contentType: mimeType,
          ),
        ),
      );
    }
    final response = await _client.post(
      ApiEndpoints.uploadReviewImages,
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
    // Backend returns list of image URLs
    final data = response.data;
    if (data is List) return data.cast<String>();
    return <String>[];
  }

  /// GET /reviews/product/:productId?skip=&take=
  Future<ReviewListResponse> getReviews(
    String productId, {
    int skip = 0,
    int take = 20,
  }) async {
    final response = await _client.get(
      ApiEndpoints.reviewsByProduct(productId),
      queryParameters: {'skip': skip, 'take': take},
    );
    return ReviewListResponse.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /reviews/product/:productId/stats
  Future<ReviewStats> getStats(String productId) async {
    final response = await _client.get(
      ApiEndpoints.reviewStatsByProduct(productId),
    );
    return ReviewStats.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /reviews/product/:productId/summary
  Future<ReviewSummaryModel?> getSummary(String productId) async {
    final response = await _client.get(
      ApiEndpoints.reviewSummaryByProduct(productId),
    );
    if (response.data == null) return null;
    return ReviewSummaryModel.fromJson(response.data as Map<String, dynamic>);
  }

  static MediaType _mimeFromExt(String ext) {
    switch (ext) {
      case 'png':
        return MediaType('image', 'png');
      case 'gif':
        return MediaType('image', 'gif');
      case 'webp':
        return MediaType('image', 'webp');
      default:
        return MediaType('image', 'jpeg');
    }
  }
}
