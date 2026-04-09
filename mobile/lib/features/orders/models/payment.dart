enum OrderPaymentStatus { pending, paid, failed, refunded }

enum OrderPaymentProvider { cod, payos, vnpay, momo, vietqr, unknown }

class OrderPayment {
  final String id;
  final String orderId;
  final OrderPaymentProvider provider;
  final double amount;
  final OrderPaymentStatus status;
  final String? transactionId;
  final String? providerRawData;
  final DateTime createdAt;
  final DateTime updatedAt;

  const OrderPayment({
    required this.id,
    required this.orderId,
    required this.provider,
    required this.amount,
    required this.status,
    required this.transactionId,
    required this.providerRawData,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OrderPayment.fromJson(Map<String, dynamic> json) {
    return OrderPayment(
      id: (json['id'] ?? '').toString(),
      orderId: (json['orderId'] ?? '').toString(),
      provider: _parseProvider(json['provider']),
      amount: _readDouble(json['amount']),
      status: _parseStatus(json['status']),
      transactionId: json['transactionId']?.toString(),
      providerRawData: json['providerRawData']?.toString(),
      createdAt: _readDate(json['createdAt']),
      updatedAt: _readDate(json['updatedAt']),
    );
  }

  bool get isPending => status == OrderPaymentStatus.pending;
  bool get isPaid => status == OrderPaymentStatus.paid;
  bool get isFailed => status == OrderPaymentStatus.failed;
}

OrderPaymentProvider _parseProvider(dynamic raw) {
  final value = (raw ?? '').toString().trim().toUpperCase();
  switch (value) {
    case 'COD':
      return OrderPaymentProvider.cod;
    case 'PAYOS':
      return OrderPaymentProvider.payos;
    case 'VNPAY':
      return OrderPaymentProvider.vnpay;
    case 'MOMO':
      return OrderPaymentProvider.momo;
    case 'VIETQR':
      return OrderPaymentProvider.vietqr;
    default:
      return OrderPaymentProvider.unknown;
  }
}

OrderPaymentStatus _parseStatus(dynamic raw) {
  final value = (raw ?? '').toString().trim().toUpperCase();
  switch (value) {
    case 'PAID':
      return OrderPaymentStatus.paid;
    case 'FAILED':
      return OrderPaymentStatus.failed;
    case 'REFUNDED':
      return OrderPaymentStatus.refunded;
    case 'PENDING':
    default:
      return OrderPaymentStatus.pending;
  }
}

DateTime _readDate(dynamic value) {
  if (value is DateTime) return value;
  if (value is String) {
    return DateTime.tryParse(value)?.toLocal() ?? DateTime.now();
  }
  return DateTime.now();
}

double _readDouble(dynamic value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}
