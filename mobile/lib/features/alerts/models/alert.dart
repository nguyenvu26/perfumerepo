import 'dart:convert';

import 'package:flutter/material.dart';
import '../services/notification_service.dart';

enum AlertCategory { order, offer, account }

enum AlertFilter { all, unread, orders, offers, account }

class Alert {
  final String id;
  final String title;
  final String message;
  final String timeLabel;
  final AlertCategory category;
  final bool isUnread;
  final String? actionLabel;
  final Color accentColor;
  final String? orderId;

  const Alert({
    required this.id,
    required this.title,
    required this.message,
    required this.timeLabel,
    required this.category,
    required this.isUnread,
    this.actionLabel,
    required this.accentColor,
    this.orderId,
  });

  /// Create from backend NotificationItem
  factory Alert.fromNotification(NotificationItem item) {
    final category = _mapTypeToCategory(item.type);
    String? orderId;
    if (item.data != null) {
      try {
        final parsed = jsonDecode(item.data!);
        if (parsed is Map) orderId = parsed['orderId'] as String?;
      } catch (_) {}
    }
    return Alert(
      id: item.id,
      title: item.title,
      message: item.content,
      timeLabel: _formatTime(item.createdAt),
      category: category,
      isUnread: !item.isRead,
      actionLabel: _actionLabelFor(category),
      accentColor: _colorFor(category),
      orderId: orderId,
    );
  }

  static AlertCategory _mapTypeToCategory(String type) {
    switch (type) {
      case 'ORDER':
      case 'SHIPPING':
        return AlertCategory.order;
      case 'PROMOTION':
        return AlertCategory.offer;
      case 'LOYALTY':
      case 'SYSTEM':
      default:
        return AlertCategory.account;
    }
  }

  static String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    if (diff.inDays == 1) return 'Hôm qua';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  static String? _actionLabelFor(AlertCategory cat) {
    switch (cat) {
      case AlertCategory.order:
        return 'Theo dõi đơn';
      case AlertCategory.offer:
        return 'Xem ưu đãi';
      case AlertCategory.account:
        return 'Xem chi tiết';
    }
  }

  static Color _colorFor(AlertCategory cat) {
    switch (cat) {
      case AlertCategory.order:
        return const Color(0xFFD4AF37);
      case AlertCategory.offer:
        return const Color(0xFFB9824A);
      case AlertCategory.account:
        return const Color(0xFF7D8F69);
    }
  }

  Alert copyWith({bool? isUnread}) {
    return Alert(
      id: id,
      title: title,
      message: message,
      timeLabel: timeLabel,
      category: category,
      isUnread: isUnread ?? this.isUnread,
      actionLabel: actionLabel,
      accentColor: accentColor,
      orderId: orderId,
    );
  }

  IconData get icon {
    switch (category) {
      case AlertCategory.order:
        return Icons.local_shipping_outlined;
      case AlertCategory.offer:
        return Icons.local_offer_outlined;
      case AlertCategory.account:
        return Icons.person_outline_rounded;
    }
  }

  String get categoryLabel {
    switch (category) {
      case AlertCategory.order:
        return 'ĐƠN HÀNG';
      case AlertCategory.offer:
        return 'ƯU ĐÃI';
      case AlertCategory.account:
        return 'TÀI KHOẢN';
    }
  }

  bool get isToday =>
      timeLabel != 'Hôm qua' &&
      timeLabel != 'Thứ Ba' &&
      !timeLabel.contains('ngày trước');
}
