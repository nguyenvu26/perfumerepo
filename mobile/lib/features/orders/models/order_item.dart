class OrderItem {
  final int id;
  final String variantId;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String productId;
  final String productName;
  final String productImage;
  final String variantLabel;

  const OrderItem({
    required this.id,
    required this.variantId,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    required this.productId,
    required this.productName,
    required this.productImage,
    required this.variantLabel,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final product = _readMap(json['product']);
    final variant = _readMap(json['variant']);
    final images = _readList(product['images']);

    String productImage = '';
    if (product['imageUrl'] != null) {
      productImage = product['imageUrl'].toString();
    } else if (product['image'] != null) {
      productImage = product['image'].toString();
    } else if (images.isNotEmpty) {
      final firstImage = _readMap(images.first);
      productImage = (firstImage['url'] ?? firstImage['imageUrl'] ?? '').toString();
    }

    final variantLabel = (variant['name'] ?? variant['sku'] ?? '').toString();

    return OrderItem(
      id: _readInt(json['id']),
      variantId: (json['variantId'] ?? '').toString(),
      quantity: _readInt(json['quantity']),
      unitPrice: _readDouble(json['unitPrice']),
      totalPrice: _readDouble(json['totalPrice']),
      productId: (product['id'] ?? '').toString(),
      productName: (product['name'] ?? 'Unknown perfume').toString(),
      productImage: productImage,
      variantLabel: variantLabel,
    );
  }
}

Map<String, dynamic> _readMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, val) => MapEntry(key.toString(), val));
  }
  return <String, dynamic>{};
}

List<dynamic> _readList(dynamic value) {
  if (value is List) return value;
  return const <dynamic>[];
}

int _readInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

double _readDouble(dynamic value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}
