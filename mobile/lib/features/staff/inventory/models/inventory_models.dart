/// Inventory variant row returned by `GET /staff/inventory`.
class InventoryVariant {
  final String id;
  final String name;
  final String? brand;
  final String variantName;
  final int stock;
  final DateTime updatedAt;
  final String? imageUrl;

  const InventoryVariant({
    required this.id,
    required this.name,
    this.brand,
    required this.variantName,
    required this.stock,
    required this.updatedAt,
    this.imageUrl,
  });

  bool get isLowStock => stock > 0 && stock <= 5;
  bool get isOutOfStock => stock <= 0;

  factory InventoryVariant.fromJson(Map<String, dynamic> json) {
    return InventoryVariant(
      id: json['id'] as String,
      name: json['name'] as String,
      brand: json['brand'] as String?,
      variantName: json['variantName'] as String,
      stock: (json['stock'] as num).toInt(),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      imageUrl: json['imageUrl'] as String?,
    );
  }
}

/// Stats summary returned alongside inventory.
class InventoryStats {
  final int totalUnits;
  final int lowStockCount;
  final DateTime? latestImportAt;

  const InventoryStats({
    required this.totalUnits,
    required this.lowStockCount,
    this.latestImportAt,
  });

  factory InventoryStats.fromJson(Map<String, dynamic> json) {
    return InventoryStats(
      totalUnits: (json['totalUnits'] as num).toInt(),
      lowStockCount: (json['lowStockCount'] as num).toInt(),
      latestImportAt: json['latestImportAt'] != null
          ? DateTime.parse(json['latestImportAt'] as String)
          : null,
    );
  }
}

/// Full inventory overview response.
class InventoryOverview {
  final String storeId;
  final InventoryStats stats;
  final List<InventoryVariant> variants;

  const InventoryOverview({
    required this.storeId,
    required this.stats,
    required this.variants,
  });

  factory InventoryOverview.fromJson(Map<String, dynamic> json) {
    return InventoryOverview(
      storeId: json['storeId'] as String,
      stats: InventoryStats.fromJson(json['stats'] as Map<String, dynamic>),
      variants: (json['variants'] as List<dynamic>)
          .map((e) => InventoryVariant.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Inventory log entry.
class InventoryLog {
  final int id;
  final String variantId;
  final String type; // IMPORT | ADJUST | SALE_POS
  final int quantity;
  final String? reason;
  final DateTime createdAt;
  final String? productName;
  final String? variantName;
  final String? staffName;

  const InventoryLog({
    required this.id,
    required this.variantId,
    required this.type,
    required this.quantity,
    this.reason,
    required this.createdAt,
    this.productName,
    this.variantName,
    this.staffName,
  });

  factory InventoryLog.fromJson(Map<String, dynamic> json) {
    final variant = json['variant'] as Map<String, dynamic>?;
    final product = variant?['product'] as Map<String, dynamic>?;
    final staff = json['staff'] as Map<String, dynamic>?;

    return InventoryLog(
      id: (json['id'] as num).toInt(),
      variantId: json['variantId'] as String,
      type: json['type'] as String,
      quantity: (json['quantity'] as num).toInt(),
      reason: json['reason'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      productName: product?['name'] as String?,
      variantName: variant?['name'] as String?,
      staffName: (staff?['fullName'] ?? staff?['email']) as String?,
    );
  }
}

/// Inventory request status.
enum InventoryRequestStatus { pending, approved, rejected }

/// Inventory request returned by POST /staff/inventory/import|adjust
/// and GET /staff/inventory/requests.
class InventoryRequestModel {
  final int id;
  final String type; // IMPORT or ADJUST
  final int quantity;
  final String? reason;
  final InventoryRequestStatus status;
  final DateTime createdAt;
  final DateTime? reviewedAt;
  final String? reviewNote;
  final String? storeName;
  final String? product;
  final String? brand;
  final String? variantName;
  final String? imageUrl;
  final String? staffName;
  final String? reviewerName;

  const InventoryRequestModel({
    required this.id,
    required this.type,
    required this.quantity,
    this.reason,
    required this.status,
    required this.createdAt,
    this.reviewedAt,
    this.reviewNote,
    this.storeName,
    this.product,
    this.brand,
    this.variantName,
    this.imageUrl,
    this.staffName,
    this.reviewerName,
  });

  bool get isPending => status == InventoryRequestStatus.pending;
  bool get isApproved => status == InventoryRequestStatus.approved;
  bool get isRejected => status == InventoryRequestStatus.rejected;

  factory InventoryRequestModel.fromJson(Map<String, dynamic> json) {
    final statusStr = (json['status'] as String? ?? 'PENDING').toUpperCase();
    final InventoryRequestStatus st;
    switch (statusStr) {
      case 'APPROVED':
        st = InventoryRequestStatus.approved;
        break;
      case 'REJECTED':
        st = InventoryRequestStatus.rejected;
        break;
      default:
        st = InventoryRequestStatus.pending;
    }

    final store = json['store'] as Map<String, dynamic>?;
    final staff = json['staff'] as Map<String, dynamic>?;
    final reviewer = json['reviewer'] as Map<String, dynamic>?;

    return InventoryRequestModel(
      id: (json['id'] as num).toInt(),
      type: json['type'] as String? ?? 'IMPORT',
      quantity: (json['quantity'] as num).toInt(),
      reason: json['reason'] as String?,
      status: st,
      createdAt: DateTime.parse(json['createdAt'] as String),
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.parse(json['reviewedAt'] as String)
          : null,
      reviewNote: json['reviewNote'] as String?,
      storeName: store?['name'] as String?,
      product: json['product'] as String?,
      brand: json['brand'] as String?,
      variantName: json['variantName'] as String?,
      imageUrl: json['imageUrl'] as String?,
      staffName: (staff?['name'] ?? staff?['email']) as String?,
      reviewerName: (reviewer?['name'] ?? reviewer?['email']) as String?,
    );
  }
}

/// System-wide variant for import search (from GET /staff/inventory/search-products).
class SystemVariant {
  final String variantId;
  final String productName;
  final String variantName;
  final String? brand;
  final String? sku;
  final double? price;
  final String? imageUrl;

  const SystemVariant({
    required this.variantId,
    required this.productName,
    required this.variantName,
    this.brand,
    this.sku,
    this.price,
    this.imageUrl,
  });

  factory SystemVariant.fromJson(Map<String, dynamic> json) {
    return SystemVariant(
      variantId: json['variantId'] as String,
      productName: json['productName'] as String,
      variantName: json['variantName'] as String,
      brand: json['brand'] as String?,
      sku: json['sku'] as String?,
      price: (json['price'] as num?)?.toDouble(),
      imageUrl: json['imageUrl'] as String?,
    );
  }
}
