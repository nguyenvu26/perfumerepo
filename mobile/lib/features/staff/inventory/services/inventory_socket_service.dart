import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../../core/config/env.dart';

/// Manages a Socket.IO connection to the backend /inventory namespace.
///
/// Staff connects and joins a personal room (`user:{userId}`).
/// When admin approves/rejects a request, the server emits `requestReviewed`
/// which triggers a callback to refresh the UI in real time.
class InventorySocketService {
  io.Socket? _socket;

  bool get isConnected => _socket?.connected == true;

  void connect({
    required String token,
    required String userId,
    required void Function(Map<String, dynamic>) onRequestReviewed,
    void Function()? onConnected,
  }) {
    _socket?.disconnect();
    _socket?.dispose();

    _socket = io.io(
      '${EnvConfig.apiBaseUrl}/inventory',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(3000)
          .build(),
    );

    _socket!.onConnect((_) {
      _socket!.emit('joinInventory', {'userId': userId});
      onConnected?.call();
    });

    _socket!.on('requestReviewed', (data) {
      if (data is Map) {
        final map = data.map((k, v) => MapEntry(k.toString(), v));
        onRequestReviewed(map);
      }
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}

final inventorySocketServiceProvider = Provider<InventorySocketService>((ref) {
  final service = InventorySocketService();
  ref.onDispose(service.disconnect);
  return service;
});
