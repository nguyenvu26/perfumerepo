import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/config/env.dart';
import '../../../core/api/api_client.dart';
import '../../auth/providers/auth_provider.dart';

/// Holds the latest order-status-changed event from WebSocket.
class OrderStatusEvent {
  final String orderId;
  final String orderCode;
  final String status;
  final DateTime receivedAt;

  const OrderStatusEvent({
    required this.orderId,
    required this.orderCode,
    required this.status,
    required this.receivedAt,
  });
}

/// Manages a Socket.IO connection that listens for `orderStatusChanged` events.
/// When an event is received, the state is updated which causes any watchers
/// (e.g. tracking screen) to invalidate and refresh order data.
class OrderRealtimeNotifier extends StateNotifier<OrderStatusEvent?> {
  io.Socket? _socket;

  OrderRealtimeNotifier() : super(null);

  Future<void> connect({required String token, required String userId}) async {
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

    _socket!.on('orderStatusChanged', (data) {
      if (data is Map) {
        final json = data.map((k, v) => MapEntry(k.toString(), v));
        state = OrderStatusEvent(
          orderId: (json['orderId'] ?? '').toString(),
          orderCode: (json['orderCode'] ?? '').toString(),
          status: (json['status'] ?? '').toString(),
          receivedAt: DateTime.now(),
        );
      }
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}

final orderRealtimeProvider =
    StateNotifierProvider<OrderRealtimeNotifier, OrderStatusEvent?>((ref) {
      final notifier = OrderRealtimeNotifier();

      // Auto-connect when user is authenticated
      final isAuthenticated = ref.watch(authStateProvider);
      if (isAuthenticated) {
        final user = ref.read(currentUserProvider);
        final tokenStorage = ref.read(secureTokenStorageProvider);
        if (user != null) {
          tokenStorage.getAccessToken().then((token) {
            if (token != null) {
              notifier.connect(token: token, userId: user.id);
            }
          });
        }
      }

      ref.onDispose(notifier.disconnect);
      return notifier;
    });
