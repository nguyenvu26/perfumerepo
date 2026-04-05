import 'order_item.dart';

enum OrderStatus { pending, confirmed, processing, shipped, completed, cancelled }

enum PaymentStatus { pending, paid, failed, refunded }

enum ShipmentStatus {
  pending,
  pickedUp,
  inTransit,
  delivered,
  failed,
  returned,
}

extension OrderStatusX on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.pending:
        return 'Order placed';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.processing:
        return 'Preparing';
      case OrderStatus.shipped:
        return 'Out for delivery';
      case OrderStatus.completed:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get description {
    switch (this) {
      case OrderStatus.pending:
        return 'Chung toi da nhan duoc don hang cua ban.';
      case OrderStatus.confirmed:
        return 'Thanh toan da xac nhan, don hang dang duoc sap xep.';
      case OrderStatus.processing:
        return 'Don hang dang duoc dong goi tai kho.';
      case OrderStatus.shipped:
        return 'Don hang dang tren duong giao den ban.';
      case OrderStatus.completed:
        return 'Don hang da giao thanh cong.';
      case OrderStatus.cancelled:
        return 'Don hang da bi huy.';
    }
  }

  bool get isActive {
    return this != OrderStatus.completed && this != OrderStatus.cancelled;
  }
}

class ShipmentInfo {
  final String id;
  final String provider;
  final String? trackingCode;
  final String? ghnOrderCode;
  final ShipmentStatus status;
  final DateTime updatedAt;

  const ShipmentInfo({
    required this.id,
    required this.provider,
    required this.trackingCode,
    required this.ghnOrderCode,
    required this.status,
    required this.updatedAt,
  });

  factory ShipmentInfo.fromJson(Map<String, dynamic> json) {
    return ShipmentInfo(
      id: (json['id'] ?? '').toString(),
      provider: (json['provider'] ?? '').toString(),
      trackingCode: json['trackingCode']?.toString(),
      ghnOrderCode: json['ghnOrderCode']?.toString(),
      status: _parseShipmentStatus(json['status']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }
}

class Order {
  final String id;
  final String code;
  final DateTime createdAt;
  final DateTime updatedAt;
  final OrderStatus status;
  final PaymentStatus paymentStatus;
  final double totalAmount;
  final double discountAmount;
  final double finalAmount;
  final double shippingFee;
  final String shippingAddress;
  final String recipientName;
  final String phone;
  final List<OrderItem> items;
  final List<ShipmentInfo> shipments;

  const Order({
    required this.id,
    required this.code,
    required this.createdAt,
    required this.updatedAt,
    required this.status,
    required this.paymentStatus,
    required this.totalAmount,
    required this.discountAmount,
    required this.finalAmount,
    required this.shippingFee,
    required this.shippingAddress,
    required this.recipientName,
    required this.phone,
    required this.items,
    required this.shipments,
  });

  int get itemCount => items.fold<int>(0, (sum, item) => sum + item.quantity);

  OrderItem? get previewItem => items.isEmpty ? null : items.first;

  ShipmentInfo? get latestShipment {
    if (shipments.isEmpty) return null;
    final sorted = [...shipments]..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return sorted.first;
  }

  bool get canTrack => status == OrderStatus.shipped || latestShipment != null;

  bool get isCompletedBucket {
    return status == OrderStatus.completed || status == OrderStatus.cancelled;
  }

  factory Order.fromJson(Map<String, dynamic> json, {List<ShipmentInfo>? shipments}) {
    final itemsRaw = json['items'];
    final itemList = itemsRaw is List ? itemsRaw : const <dynamic>[];
    return Order(
      id: (json['id'] ?? '').toString(),
      code: (json['code'] ?? json['orderCode'] ?? '').toString(),
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      status: _parseOrderStatus(json['status']),
      paymentStatus: _parsePaymentStatus(json['paymentStatus']),
      totalAmount: _readDouble(json['totalAmount']),
      discountAmount: _readDouble(json['discountAmount']),
      finalAmount: _readDouble(json['finalAmount']),
      shippingFee: _readDouble(json['shippingFee']),
      shippingAddress: (json['shippingAddress'] ?? '').toString(),
      recipientName: (json['recipientName'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      items: itemList
          .whereType<Map>()
          .map((item) => OrderItem.fromJson(item.map((k, v) => MapEntry(k.toString(), v))))
          .toList(),
      shipments: shipments ?? const <ShipmentInfo>[],
    );
  }
}

OrderStatus _parseOrderStatus(dynamic raw) {
  final value = (raw ?? '').toString().trim().toUpperCase();
  switch (value) {
    case 'CONFIRMED':
      return OrderStatus.confirmed;
    case 'PROCESSING':
      return OrderStatus.processing;
    case 'SHIPPED':
      return OrderStatus.shipped;
    case 'COMPLETED':
      return OrderStatus.completed;
    case 'CANCELLED':
      return OrderStatus.cancelled;
    case 'PENDING':
    default:
      return OrderStatus.pending;
  }
}

PaymentStatus _parsePaymentStatus(dynamic raw) {
  final value = (raw ?? '').toString().trim().toUpperCase();
  switch (value) {
    case 'PAID':
      return PaymentStatus.paid;
    case 'FAILED':
      return PaymentStatus.failed;
    case 'REFUNDED':
      return PaymentStatus.refunded;
    case 'PENDING':
    default:
      return PaymentStatus.pending;
  }
}

ShipmentStatus _parseShipmentStatus(dynamic raw) {
  final value = (raw ?? '').toString().trim().toUpperCase();
  switch (value) {
    case 'PICKED_UP':
      return ShipmentStatus.pickedUp;
    case 'IN_TRANSIT':
      return ShipmentStatus.inTransit;
    case 'DELIVERED':
      return ShipmentStatus.delivered;
    case 'FAILED':
      return ShipmentStatus.failed;
    case 'RETURNED':
      return ShipmentStatus.returned;
    case 'PENDING':
    default:
      return ShipmentStatus.pending;
  }
}

double _readDouble(dynamic value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}

DateTime _parseDate(dynamic value) {
  if (value is DateTime) return value.toLocal();
  if (value is String) {
    return DateTime.tryParse(value)?.toLocal() ?? DateTime.now();
  }
  return DateTime.now();
}
