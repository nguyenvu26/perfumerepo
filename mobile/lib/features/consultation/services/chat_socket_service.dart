import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../core/config/env.dart';
import '../models/chat_message.dart';

/// Manages the Socket.IO connection to the backend /chat namespace.
///
/// Flow:
///   connect() → onConnect → emit "joinConversation"
///   sendMessage() → emit "sendMessage"
///   on "messageReceived" → callback with AI [ChatMessage]
class ChatSocketService {
  io.Socket? _socket;

  bool get isConnected => _socket?.connected == true;

  void connect({
    required String token,
    required String conversationId,
    required void Function(ChatMessage) onMessage,
    void Function()? onConnected,
    void Function(String)? onError,
  }) {
    // Disconnect any existing socket first
    _socket?.disconnect();
    _socket?.dispose();

    _socket = io.io(
      '${EnvConfig.apiBaseUrl}/chat',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .build(),
    );

    _socket!.onConnect((_) {
      _socket!.emit('joinConversation', {'conversationId': conversationId});
      onConnected?.call();
    });

    _socket!.on('messageReceived', (data) {
      try {
        final Map<String, dynamic> map;
        if (data is Map) {
          map = data.map((k, v) => MapEntry(k.toString(), v));
        } else {
          return;
        }
        final msg = ChatMessage.fromJson(map);
        // Only forward AI messages — user messages are already added optimistically
        if (msg.isAI) onMessage(msg);
      } catch (_) {}
    });

    _socket!.onConnectError((err) => onError?.call(err.toString()));
    _socket!.onError((err) => onError?.call(err.toString()));
    _socket!.onDisconnect((_) {});

    _socket!.connect();
  }

  /// emit "sendMessage" — AI reply arrives via "messageReceived" event
  void sendMessage(String conversationId, String text) {
    _socket?.emit('sendMessage', {
      'conversationId': conversationId,
      'type': 'TEXT',
      'content': {'text': text},
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}

final chatSocketServiceProvider = Provider.autoDispose<ChatSocketService>((
  ref,
) {
  final service = ChatSocketService();
  ref.onDispose(service.disconnect);
  return service;
});
