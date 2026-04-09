enum PaymentMethodType {
  cod,
  payos,

  /// Legacy — kept for backward compatibility, not shown in checkout UI.
  vnpay,
  momo;

  static PaymentMethodType fromBackend(String? raw) {
    switch ((raw ?? '').toUpperCase()) {
      case 'COD':
        return PaymentMethodType.cod;
      case 'PAYOS':
        return PaymentMethodType.payos;
      case 'VNPAY':
        return PaymentMethodType.vnpay;
      case 'MOMO':
        return PaymentMethodType.momo;
      default:
        return PaymentMethodType.cod;
    }
  }

  String get backendValue {
    switch (this) {
      case PaymentMethodType.cod:
        return 'COD';
      case PaymentMethodType.payos:
        return 'PAYOS';
      case PaymentMethodType.vnpay:
        return 'VNPAY';
      case PaymentMethodType.momo:
        return 'MOMO';
    }
  }

  String get displayName {
    switch (this) {
      case PaymentMethodType.cod:
        return 'Thanh toán khi nhận hàng';
      case PaymentMethodType.payos:
        return 'Chuyển khoản / PayOS';
      case PaymentMethodType.vnpay:
        return 'VNPay';
      case PaymentMethodType.momo:
        return 'Momo';
    }
  }

  String get description {
    switch (this) {
      case PaymentMethodType.cod:
        return 'Thanh toán khi nhận sản phẩm';
      case PaymentMethodType.payos:
        return 'Quét mã QR hoặc chuyển khoản ngân hàng';
      case PaymentMethodType.vnpay:
        return 'Thanh toán bằng ví điện tử VNPay';
      case PaymentMethodType.momo:
        return 'Thanh toán bằng ví điện tử Momo';
    }
  }

  String get iconAsset {
    switch (this) {
      case PaymentMethodType.cod:
        return 'assets/icons/cod.png';
      case PaymentMethodType.payos:
        return 'assets/icons/payos.png';
      case PaymentMethodType.vnpay:
        return 'assets/icons/vnpay.png';
      case PaymentMethodType.momo:
        return 'assets/icons/momo.png';
    }
  }

  bool get requiresOnlinePayment {
    return this == PaymentMethodType.payos ||
        this == PaymentMethodType.vnpay ||
        this == PaymentMethodType.momo;
  }
}

class PaymentMethod {
  final String id;
  final PaymentMethodType type;
  final String label;
  final String description;
  final bool isDefault;

  // Legacy field kept for backward compatibility with older checkout UI.
  final bool isEnabled;

  PaymentMethod({
    required this.id,
    required this.type,
    required this.label,
    required this.description,
    this.isDefault = false,
    this.isEnabled = true,
  });

  PaymentMethod copyWith({
    String? id,
    PaymentMethodType? type,
    String? label,
    String? description,
    bool? isDefault,
    bool? isEnabled,
  }) {
    return PaymentMethod(
      id: id ?? this.id,
      type: type ?? this.type,
      label: label ?? this.label,
      description: description ?? this.description,
      isDefault: isDefault ?? this.isDefault,
      isEnabled: isEnabled ?? this.isEnabled,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.backendValue,
      'label': label,
      'description': description,
      'is_default': isDefault,
      'is_enabled': isEnabled,
    };
  }

  factory PaymentMethod.fromJson(Map<String, dynamic> json) {
    final type = PaymentMethodType.fromBackend(json['type']?.toString());
    final id = (json['id'] ?? '').toString();
    final label = (json['label'] ?? '').toString();
    final description = (json['description'] ?? '').toString();

    return PaymentMethod(
      id: id.isEmpty ? type.backendValue.toLowerCase() : id,
      type: type,
      label: label.isEmpty ? type.displayName : label,
      description: description.isEmpty ? type.description : description,
      isDefault: json['is_default'] as bool? ?? false,
      isEnabled: json['is_enabled'] as bool? ?? true,
    );
  }
}

enum PaymentStatus {
  pending,
  processing,
  success,
  failed,
  cancelled;

  String get displayName {
    switch (this) {
      case PaymentStatus.pending:
        return 'Chờ xử lý';
      case PaymentStatus.processing:
        return 'Đang xử lý';
      case PaymentStatus.success:
        return 'Thành công';
      case PaymentStatus.failed:
        return 'Thất bại';
      case PaymentStatus.cancelled:
        return 'Đã hủy';
    }
  }
}

class PaymentTransaction {
  final String id;
  final String orderId;
  final PaymentMethodType method;
  final double amount;
  final PaymentStatus status;
  final DateTime createdAt;
  final String? transactionId; // VNPay/Momo transaction ID
  final String? errorMessage;
  final Map<String, dynamic>? metadata;

  PaymentTransaction({
    required this.id,
    required this.orderId,
    required this.method,
    required this.amount,
    required this.status,
    required this.createdAt,
    this.transactionId,
    this.errorMessage,
    this.metadata,
  });

  factory PaymentTransaction.fromJson(Map<String, dynamic> json) {
    return PaymentTransaction(
      id: json['id'] as String,
      orderId: json['order_id'] as String,
      method: PaymentMethodType.values.firstWhere(
        (e) => e.name == json['method'],
        orElse: () => PaymentMethodType.cod,
      ),
      amount: (json['amount'] as num).toDouble(),
      status: PaymentStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => PaymentStatus.pending,
      ),
      createdAt: DateTime.parse(json['created_at'] as String),
      transactionId: json['transaction_id'] as String?,
      errorMessage: json['error_message'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'method': method.name,
      'amount': amount,
      'status': status.name,
      'created_at': createdAt.toIso8601String(),
      'transaction_id': transactionId,
      'error_message': errorMessage,
      'metadata': metadata,
    };
  }
}
