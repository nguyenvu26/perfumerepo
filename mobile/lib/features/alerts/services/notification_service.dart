import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class NotificationService {
  final ApiClient _apiClient;

  const NotificationService(this._apiClient);

  /// Fetch notifications (paginated, optional type filter)
  Future<NotificationListResponse> getNotifications({
    int skip = 0,
    int take = 20,
    String? type,
  }) async {
    final params = <String, dynamic>{'skip': skip, 'take': take};
    if (type != null) params['type'] = type;

    final response = await _apiClient.get<Map<String, dynamic>>(
      '/notifications',
      queryParameters: params,
    );
    return NotificationListResponse.fromJson(response.data!);
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/notifications/unread-count',
    );
    return response.data?['count'] ?? 0;
  }

  /// Mark a single notification as read
  Future<void> markAsRead(String id) async {
    await _apiClient.patch('/notifications/$id/read');
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    await _apiClient.patch('/notifications/mark-all-read');
  }

  /// Delete a notification
  Future<void> delete(String id) async {
    await _apiClient.delete('/notifications/$id');
  }
}

class NotificationListResponse {
  final List<NotificationItem> data;
  final int total;

  NotificationListResponse({required this.data, required this.total});

  factory NotificationListResponse.fromJson(Map<String, dynamic> json) {
    return NotificationListResponse(
      data: (json['data'] as List? ?? [])
          .map(
            (e) => NotificationItem.fromJson(
              (e as Map).map((k, v) => MapEntry(k.toString(), v)),
            ),
          )
          .toList(),
      total: json['total'] ?? 0,
    );
  }
}

class NotificationItem {
  final String id;
  final String type;
  final String title;
  final String content;
  final String? data;
  final bool isRead;
  final DateTime createdAt;

  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.content,
    this.data,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'SYSTEM',
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      data: json['data'] as String?,
      isRead: json['isRead'] as bool? ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(ref.watch(apiClientProvider));
});
