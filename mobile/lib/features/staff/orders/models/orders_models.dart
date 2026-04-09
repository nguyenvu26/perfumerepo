/// Paginated list response for staff orders.
class OrdersPage {
  final List<StaffOrder> data;
  final int total;
  final int skip;
  final int take;
  final int pages;

  const OrdersPage({
    required this.data,
    required this.total,
    required this.skip,
    required this.take,
    required this.pages,
  });

  factory OrdersPage.fromJson(Map<String, dynamic> json) {
    return OrdersPage(
      data: (json['data'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map((e) => StaffOrder.fromJson(e))
          .toList(),
      total: (json['total'] as num?)?.toInt() ?? 0,
      skip: (json['skip'] as num?)?.toInt() ?? 0,
      take: (json['take'] as num?)?.toInt() ?? 20,
      pages: (json['pages'] as num?)?.toInt() ?? 0,
    );
  }
}

/// A single staff POS order.
class StaffOrder {
  final String id;
  final String code;
  final double totalAmount;
  final double discountAmount;
  final double finalAmount;
  final String status;
  final String paymentStatus;
  final String? phone;
  final DateTime createdAt;
  final StaffOrderCustomer? user;
  final StaffOrderStore? store;
  final StaffOrderStaff? staff;
  final List<StaffOrderItem> items;
  final List<StaffOrderPayment> payments;

  const StaffOrder({
    required this.id,
    required this.code,
    required this.totalAmount,
    required this.discountAmount,
    required this.finalAmount,
    required this.status,
    required this.paymentStatus,
    this.phone,
    required this.createdAt,
    this.user,
    this.store,
    this.staff,
    this.items = const [],
    this.payments = const [],
  });

  bool get isPaid => paymentStatus == 'PAID';

  String get customerDisplay {
    if (user?.fullName != null) return user!.fullName!;
    if (user?.phone != null) return user!.phone!;
    if (phone != null) return phone!;
    return 'Khách lẻ';
  }

  factory StaffOrder.fromJson(Map<String, dynamic> json) {
    return StaffOrder(
      id: json['id'] as String,
      code: json['code'] as String,
      totalAmount: (json['totalAmount'] as num).toDouble(),
      discountAmount: (json['discountAmount'] as num? ?? 0).toDouble(),
      finalAmount: (json['finalAmount'] as num).toDouble(),
      status: json['status'] as String,
      paymentStatus: json['paymentStatus'] as String,
      phone: json['phone'] as String?,
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      user: json['user'] != null
          ? StaffOrderCustomer.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      store: json['store'] != null
          ? StaffOrderStore.fromJson(json['store'] as Map<String, dynamic>)
          : null,
      staff: json['staff'] != null
          ? StaffOrderStaff.fromJson(json['staff'] as Map<String, dynamic>)
          : null,
      items: (json['items'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map((e) => StaffOrderItem.fromJson(e))
          .toList(),
      payments: (json['payments'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map((e) => StaffOrderPayment.fromJson(e))
          .toList(),
    );
  }
}

class StaffOrderCustomer {
  final String id;
  final String? fullName;
  final String? email;
  final String? phone;

  const StaffOrderCustomer({
    required this.id,
    this.fullName,
    this.email,
    this.phone,
  });

  factory StaffOrderCustomer.fromJson(Map<String, dynamic> json) {
    return StaffOrderCustomer(
      id: json['id'] as String,
      fullName: json['fullName'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
    );
  }
}

class StaffOrderStore {
  final String id;
  final String name;
  final String? code;

  const StaffOrderStore({required this.id, required this.name, this.code});

  factory StaffOrderStore.fromJson(Map<String, dynamic> json) {
    return StaffOrderStore(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String?,
    );
  }
}

class StaffOrderStaff {
  final String id;
  final String? fullName;
  final String? email;

  const StaffOrderStaff({required this.id, this.fullName, this.email});

  factory StaffOrderStaff.fromJson(Map<String, dynamic> json) {
    return StaffOrderStaff(
      id: json['id'] as String,
      fullName: json['fullName'] as String?,
      email: json['email'] as String?,
    );
  }
}

class StaffOrderItem {
  final String id;
  final String variantId;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final StaffOrderItemVariant? variant;

  const StaffOrderItem({
    required this.id,
    required this.variantId,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.variant,
  });

  factory StaffOrderItem.fromJson(Map<String, dynamic> json) {
    return StaffOrderItem(
      id: json['id'].toString(),
      variantId: json['variantId'] as String,
      quantity: (json['quantity'] as num).toInt(),
      unitPrice: (json['unitPrice'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num).toDouble(),
      variant: json['variant'] != null
          ? StaffOrderItemVariant.fromJson(
              json['variant'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}

class StaffOrderItemVariant {
  final String id;
  final String name;
  final double price;
  final StaffOrderItemProduct? product;

  const StaffOrderItemVariant({
    required this.id,
    required this.name,
    required this.price,
    this.product,
  });

  factory StaffOrderItemVariant.fromJson(Map<String, dynamic> json) {
    return StaffOrderItemVariant(
      id: json['id'] as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      product: json['product'] != null
          ? StaffOrderItemProduct.fromJson(
              json['product'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}

class StaffOrderItemProduct {
  final String id;
  final String name;

  const StaffOrderItemProduct({required this.id, required this.name});

  factory StaffOrderItemProduct.fromJson(Map<String, dynamic> json) {
    return StaffOrderItemProduct(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

class StaffOrderPayment {
  final String id;
  final String provider;
  final double amount;
  final String status;

  const StaffOrderPayment({
    required this.id,
    required this.provider,
    required this.amount,
    required this.status,
  });

  factory StaffOrderPayment.fromJson(Map<String, dynamic> json) {
    return StaffOrderPayment(
      id: json['id'] as String,
      provider: json['provider'] as String,
      amount: (json['amount'] as num).toDouble(),
      status: json['status'] as String,
    );
  }
}
