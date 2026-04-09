class ReviewUser {
  final String id;
  final String fullName;
  final String? avatarUrl;

  const ReviewUser({required this.id, required this.fullName, this.avatarUrl});

  factory ReviewUser.fromJson(Map<String, dynamic> json) => ReviewUser(
    id: json['id']?.toString() ?? '',
    fullName: json['fullName']?.toString() ?? 'Ẩn danh',
    avatarUrl: json['avatarUrl']?.toString(),
  );
}

class ReviewImage {
  final String id;
  final String imageUrl;

  const ReviewImage({required this.id, required this.imageUrl});

  factory ReviewImage.fromJson(Map<String, dynamic> json) => ReviewImage(
    id: json['id']?.toString() ?? '',
    imageUrl: json['imageUrl']?.toString() ?? '',
  );
}

class ReviewItem {
  final String id;
  final String productId;
  final ReviewUser user;
  final int rating;
  final String? content;
  final bool isVerified;
  final bool isPinned;
  final DateTime createdAt;
  final List<ReviewImage> images;
  final int helpfulCount;

  const ReviewItem({
    required this.id,
    required this.productId,
    required this.user,
    required this.rating,
    this.content,
    required this.isVerified,
    required this.isPinned,
    required this.createdAt,
    required this.images,
    required this.helpfulCount,
  });

  factory ReviewItem.fromJson(Map<String, dynamic> json) {
    final countMap = json['_count'] as Map<String, dynamic>?;
    final reactionsCount = (countMap?['reactions'] as num?)?.toInt() ?? 0;

    final imagesList =
        (json['images'] as List<dynamic>?)
            ?.map((e) => ReviewImage.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return ReviewItem(
      id: json['id']?.toString() ?? '',
      productId: json['productId']?.toString() ?? '',
      user: ReviewUser.fromJson((json['user'] as Map<String, dynamic>?) ?? {}),
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      content: json['content']?.toString(),
      isVerified: json['isVerified'] as bool? ?? true,
      isPinned: json['isPinned'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      images: imagesList,
      helpfulCount: reactionsCount,
    );
  }
}

class ReviewListResponse {
  final List<ReviewItem> items;
  final int total;

  const ReviewListResponse({required this.items, required this.total});

  factory ReviewListResponse.fromJson(Map<String, dynamic> json) =>
      ReviewListResponse(
        items:
            (json['items'] as List<dynamic>?)
                ?.map((e) => ReviewItem.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        total: (json['total'] as num?)?.toInt() ?? 0,
      );
}

class ReviewStats {
  final double average;
  final int total;
  final Map<int, int> distribution;

  const ReviewStats({
    required this.average,
    required this.total,
    required this.distribution,
  });

  factory ReviewStats.fromJson(Map<String, dynamic> json) {
    final raw = json['distribution'] as Map<String, dynamic>? ?? {};
    final dist = <int, int>{};
    for (final entry in raw.entries) {
      final key = int.tryParse(entry.key);
      final val = (entry.value as num?)?.toInt() ?? 0;
      if (key != null) dist[key] = val;
    }
    return ReviewStats(
      average: (json['average'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toInt() ?? 0,
      distribution: dist,
    );
  }

  static ReviewStats empty() =>
      const ReviewStats(average: 0, total: 0, distribution: {});
}

class ReviewSummaryModel {
  final String id;
  final String productId;
  final String summary;
  final String? pros;
  final String? cons;
  final String? keywords;
  final String? sentiment;

  const ReviewSummaryModel({
    required this.id,
    required this.productId,
    required this.summary,
    this.pros,
    this.cons,
    this.keywords,
    this.sentiment,
  });

  factory ReviewSummaryModel.fromJson(Map<String, dynamic> json) =>
      ReviewSummaryModel(
        id: json['id']?.toString() ?? '',
        productId: json['productId']?.toString() ?? '',
        summary: json['summary']?.toString() ?? '',
        pros: json['pros']?.toString(),
        cons: json['cons']?.toString(),
        keywords: json['keywords']?.toString(),
        sentiment: json['sentiment']?.toString(),
      );
}
