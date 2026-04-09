/// Product variant available in a store for POS.
class PosProduct {
  final String id;
  final String name;
  final String? slug;
  final PosProductBrand? brand;
  final List<PosProductImage> images;
  final List<PosVariant> variants;

  const PosProduct({
    required this.id,
    required this.name,
    this.slug,
    this.brand,
    this.images = const [],
    this.variants = const [],
  });

  factory PosProduct.fromJson(Map<String, dynamic> json) {
    return PosProduct(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String?,
      brand: json['brand'] != null
          ? PosProductBrand.fromJson(json['brand'] as Map<String, dynamic>)
          : null,
      images:
          (json['images'] as List<dynamic>?)
              ?.map((e) => PosProductImage.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      variants:
          (json['variants'] as List<dynamic>?)
              ?.map((e) => PosVariant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }
}

class PosProductBrand {
  final String id;
  final String name;

  const PosProductBrand({required this.id, required this.name});

  factory PosProductBrand.fromJson(Map<String, dynamic> json) {
    return PosProductBrand(
      id: json['id'].toString(),
      name: json['name'] as String,
    );
  }
}

class PosProductImage {
  final String url;

  const PosProductImage({required this.url});

  factory PosProductImage.fromJson(Map<String, dynamic> json) {
    return PosProductImage(url: json['url'] as String);
  }
}

class PosVariant {
  final String id;
  final String name;
  final double price;
  final String? sku;
  final String? barcode;
  final int stock;

  const PosVariant({
    required this.id,
    required this.name,
    required this.price,
    this.sku,
    this.barcode,
    required this.stock,
  });

  factory PosVariant.fromJson(Map<String, dynamic> json) {
    return PosVariant(
      id: json['id'] as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      sku: json['sku'] as String?,
      barcode: json['barcode'] as String?,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
    );
  }
}

/// A POS order (draft or completed).
class PosOrder {
  final String id;
  final String code;
  final String? storeId;
  final double totalAmount;
  final double discountAmount;
  final double finalAmount;
  final String status;
  final String paymentStatus;
  final PosOrderCustomer? user;
  final String? phone;
  final List<PosOrderItem> items;

  const PosOrder({
    required this.id,
    required this.code,
    this.storeId,
    required this.totalAmount,
    required this.discountAmount,
    required this.finalAmount,
    required this.status,
    required this.paymentStatus,
    this.user,
    this.phone,
    this.items = const [],
  });

  bool get isPaid => paymentStatus == 'PAID';

  factory PosOrder.fromJson(Map<String, dynamic> json) {
    return PosOrder(
      id: json['id'] as String,
      code: json['code'] as String,
      storeId: json['storeId'] as String?,
      totalAmount: (json['totalAmount'] as num).toDouble(),
      discountAmount: (json['discountAmount'] as num).toDouble(),
      finalAmount: (json['finalAmount'] as num).toDouble(),
      status: json['status'] as String,
      paymentStatus: json['paymentStatus'] as String,
      phone: json['phone'] as String?,
      user: json['user'] != null
          ? PosOrderCustomer.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => PosOrderItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }
}

class PosOrderCustomer {
  final String id;
  final String? fullName;
  final String? phone;
  final int loyaltyPoints;

  const PosOrderCustomer({
    required this.id,
    this.fullName,
    this.phone,
    required this.loyaltyPoints,
  });

  factory PosOrderCustomer.fromJson(Map<String, dynamic> json) {
    return PosOrderCustomer(
      id: json['id'] as String,
      fullName: json['fullName'] as String?,
      phone: json['phone'] as String?,
      loyaltyPoints: (json['loyaltyPoints'] as num?)?.toInt() ?? 0,
    );
  }
}

class PosOrderItem {
  final String id;
  final String variantId;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final PosOrderItemVariant? variant;

  const PosOrderItem({
    required this.id,
    required this.variantId,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.variant,
  });

  factory PosOrderItem.fromJson(Map<String, dynamic> json) {
    return PosOrderItem(
      id: json['id'].toString(),
      variantId: json['variantId'] as String,
      quantity: (json['quantity'] as num).toInt(),
      unitPrice: (json['unitPrice'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num).toDouble(),
      variant: json['variant'] != null
          ? PosOrderItemVariant.fromJson(
              json['variant'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}

class PosOrderItemVariant {
  final String id;
  final String name;
  final double price;
  final PosOrderItemProduct? product;

  const PosOrderItemVariant({
    required this.id,
    required this.name,
    required this.price,
    this.product,
  });

  factory PosOrderItemVariant.fromJson(Map<String, dynamic> json) {
    return PosOrderItemVariant(
      id: json['id'] as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      product: json['product'] != null
          ? PosOrderItemProduct.fromJson(
              json['product'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}

class PosOrderItemProduct {
  final String id;
  final String name;

  const PosOrderItemProduct({required this.id, required this.name});

  factory PosOrderItemProduct.fromJson(Map<String, dynamic> json) {
    return PosOrderItemProduct(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

/// Loyalty lookup result.
class LoyaltyResult {
  final bool registered;
  final String? userId;
  final String? fullName;
  final String? phone;
  final int loyaltyPoints;

  const LoyaltyResult({
    required this.registered,
    this.userId,
    this.fullName,
    this.phone,
    required this.loyaltyPoints,
  });

  factory LoyaltyResult.fromJson(Map<String, dynamic> json) {
    return LoyaltyResult(
      registered: json['registered'] as bool? ?? false,
      userId: json['userId'] as String?,
      fullName: json['fullName'] as String?,
      phone: json['phone'] as String?,
      loyaltyPoints: (json['loyaltyPoints'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Local cart item (before checkout — no backend order created yet).
class LocalCartItem {
  final String variantId;
  final String variantName;
  final String productName;
  final double price;
  final int stock;
  int quantity;

  LocalCartItem({
    required this.variantId,
    required this.variantName,
    required this.productName,
    required this.price,
    required this.stock,
    this.quantity = 1,
  });

  double get totalPrice => price * quantity;

  /// Payload for the checkout API.
  Map<String, dynamic> toCheckoutJson() => {
    'variantId': variantId,
    'quantity': quantity,
  };
}
