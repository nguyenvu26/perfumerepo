import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class LoyaltyTransaction {
  final String id;
  final int points;
  final String reason;
  final DateTime createdAt;

  const LoyaltyTransaction({
    required this.id,
    required this.points,
    required this.reason,
    required this.createdAt,
  });

  factory LoyaltyTransaction.fromJson(Map<String, dynamic> json) {
    return LoyaltyTransaction(
      id: (json['id'] ?? '').toString(),
      points: _readInt(json['points']),
      reason: (json['reason'] ?? '').toString(),
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class LoyaltyStatus {
  final int points;
  final List<LoyaltyTransaction> history;

  const LoyaltyStatus({required this.points, required this.history});

  factory LoyaltyStatus.fromJson(Map<String, dynamic> json) {
    final historyRaw = json['history'];
    final history = historyRaw is List
        ? historyRaw
              .whereType<Map>()
              .map(
                (e) => LoyaltyTransaction.fromJson(
                  e.map((k, v) => MapEntry(k.toString(), v)),
                ),
              )
              .toList()
        : <LoyaltyTransaction>[];
    return LoyaltyStatus(points: _readInt(json['points']), history: history);
  }

  /// Value per 1 point in VND
  static const int pointValue = 500;
  static const int earnRate = 10000; // 10,000đ = 1 point

  int get totalValueVnd => points * pointValue;

  String get tierName {
    if (points >= 5000) return 'Platinum';
    if (points >= 2000) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'Bronze';
  }

  int get nextTierPoints {
    if (points < 500) return 500;
    if (points < 2000) return 2000;
    if (points < 5000) return 5000;
    return 5000;
  }

  double get tierProgress {
    if (points >= 5000) return 1.0;
    return (points / nextTierPoints).clamp(0.0, 1.0);
  }
}

class LoyaltyService {
  final ApiClient _apiClient;

  const LoyaltyService(this._apiClient);

  Future<LoyaltyStatus> getStatus() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/loyalty/status',
    );
    return LoyaltyStatus.fromJson(response.data!);
  }
}

int _readInt(dynamic v) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

// ──────────────────────────────────────────────
// Providers
// ──────────────────────────────────────────────

final loyaltyServiceProvider = Provider<LoyaltyService>((ref) {
  final client = ref.read(apiClientProvider);
  return LoyaltyService(client);
});

final loyaltyStatusProvider = FutureProvider.autoDispose<LoyaltyStatus>((ref) {
  return ref.read(loyaltyServiceProvider).getStatus();
});
