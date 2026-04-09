import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../core/config/env.dart';
import '../models/alert.dart';
import '../services/notification_service.dart';

/// Manages the Socket.IO connection to the backend /notifications namespace.
class NotificationSocketService {
  io.Socket? _socket;

  bool get isConnected => _socket?.connected == true;

  void connect({
    required String token,
    required String userId,
    required void Function(Alert) onNotification,
    required void Function(int) onUnreadCount,
    void Function(Map<String, dynamic>)? onOrderStatusChanged,
  }) {
    _socket?.disconnect();
    _socket?.dispose();

    _socket = io.io(
      '${EnvConfig.apiBaseUrl}/notifications',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .build(),
    );

    _socket!.onConnect((_) {
      _socket!.emit('join', {'userId': userId});
    });

    _socket!.on('notification', (data) {
      try {
        if (data is Map) {
          final json = data.map((k, v) => MapEntry(k.toString(), v));
          final item = NotificationItem.fromJson(json);
          onNotification(Alert.fromNotification(item));
        }
      } catch (_) {}
    });

    _socket!.on('unreadCount', (data) {
      try {
        if (data is Map) {
          final count = data['count'];
          if (count is int) onUnreadCount(count);
        }
      } catch (_) {}
    });

    _socket!.on('orderStatusChanged', (data) {
      try {
        if (data is Map && onOrderStatusChanged != null) {
          final json = data.map((k, v) => MapEntry(k.toString(), v));
          onOrderStatusChanged(json);
        }
      } catch (_) {}
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}

final notificationSocketServiceProvider =
    Provider.autoDispose<NotificationSocketService>((ref) {
      final service = NotificationSocketService();
      ref.onDispose(service.disconnect);
      return service;
    });
