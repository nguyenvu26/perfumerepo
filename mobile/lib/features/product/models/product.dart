class ProductVariant {
  final String id;
  final String name;
  final double price;
  final int stock;
  final bool isActive;

  const ProductVariant({
    required this.id,
    required this.name,
    required this.price,
    required this.stock,
    required this.isActive,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    final rawId = json['id']?.toString() ?? '';
    final rawName = json['name']?.toString() ?? '';

    return ProductVariant(
      id: rawId,
      name: rawName.isEmpty ? 'Unknown variant' : rawName,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'stock': stock,
      'isActive': isActive,
    };
  }
}

class Product {
  final String id;
  final String name;
  final String brand;
  final double price;
  final String imageUrl;
  final String? description;
  final String? story;
  final double? rating;
  final int? reviews;
  final List<String> notes;
  final List<String> topNotes;
  final List<String> heartNotes;
  final List<String> baseNotes;
  final String? size;
  final String? variant;
  final List<ProductVariant> variants;
  final bool? inStock;
  final List<String>? images;

  Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.price,
    required this.imageUrl,
    this.description,
    this.story,
    this.rating,
    this.reviews,
    this.notes = const [],
    this.topNotes = const [],
    this.heartNotes = const [],
    this.baseNotes = const [],
    this.size,
    this.variant,
    this.variants = const [],
    this.inStock = true,
    this.images,
  });

  Product copyWith({
    String? id,
    String? name,
    String? brand,
    double? price,
    String? imageUrl,
    String? description,
    String? story,
    double? rating,
    int? reviews,
    List<String>? notes,
    List<String>? topNotes,
    List<String>? heartNotes,
    List<String>? baseNotes,
    String? size,
    String? variant,
    List<ProductVariant>? variants,
    bool? inStock,
    List<String>? images,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      brand: brand ?? this.brand,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
      description: description ?? this.description,
      story: story ?? this.story,
      rating: rating ?? this.rating,
      reviews: reviews ?? this.reviews,
      notes: notes ?? this.notes,
      topNotes: topNotes ?? this.topNotes,
      heartNotes: heartNotes ?? this.heartNotes,
      baseNotes: baseNotes ?? this.baseNotes,
      size: size ?? this.size,
      variant: variant ?? this.variant,
      variants: variants ?? this.variants,
      inStock: inStock ?? this.inStock,
      images: images ?? this.images,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'brand': brand,
      'price': price,
      'image_url': imageUrl,
      'description': description,
      'rating': rating,
      'reviews': reviews,
      'notes': notes,
      'top_notes': topNotes,
      'heart_notes': heartNotes,
      'base_notes': baseNotes,
      'size': size,
      'variant': variant,
      'variants': variants.map((v) => v.toJson()).toList(),
      'in_stock': inStock,
      'images': images,
    };
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    List<String> parseStringList(dynamic raw) {
      if (raw is! List) return <String>[];
      return raw
          .map((item) => item?.toString())
          .whereType<String>()
          .where((item) => item.trim().isNotEmpty)
          .toList();
    }

    final dynamic brandRaw = json['brand'];
    final brandName = brandRaw is String
        ? brandRaw
        : (brandRaw is Map<String, dynamic>
              ? (brandRaw['name']?.toString() ?? '')
              : '');

    final dynamic variantsRaw = json['variants'];
    final rawVariants = variantsRaw is List
        ? variantsRaw.whereType<Map<String, dynamic>>().toList()
        : const <Map<String, dynamic>>[];
    final parsedVariants = rawVariants
        .map(ProductVariant.fromJson)
        .where((variant) => variant.id.isNotEmpty)
        .toList();
    final firstVariant = parsedVariants.isNotEmpty
        ? parsedVariants.first
        : null;

    final dynamic imagesRaw = json['images'];
    final imageList = imagesRaw is List
        ? imagesRaw
              .map((e) {
                if (e is String) return e;
                if (e is Map<String, dynamic>) return e['url']?.toString();
                return null;
              })
              .whereType<String>()
              .where((url) => url.trim().isNotEmpty)
              .toList()
        : <String>[];

    final dynamic notesRaw = json['notes'];
    final parsedNotes = notesRaw is List
        ? notesRaw
              .map((e) {
                if (e is String) return e;
                if (e is Map<String, dynamic>) {
                  final note = e['note'];
                  if (note is Map<String, dynamic>) {
                    return note['name']?.toString();
                  }
                }
                return null;
              })
              .whereType<String>()
              .toList()
        : <String>[];

    final topNotes = parseStringList(json['top_notes'] ?? json['topNotes']);
    final heartNotes = parseStringList(
      json['heart_notes'] ?? json['heartNotes'],
    );
    final baseNotes = parseStringList(json['base_notes'] ?? json['baseNotes']);

    if (notesRaw is List) {
      for (final entry in notesRaw) {
        if (entry is! Map<String, dynamic>) continue;
        final noteRaw = entry['note'];
        if (noteRaw is! Map<String, dynamic>) continue;

        final noteName = noteRaw['name']?.toString();
        final noteType = noteRaw['type']?.toString().toUpperCase();
        if (noteName == null || noteName.isEmpty || noteType == null) continue;

        if (noteType == 'TOP' && !topNotes.contains(noteName)) {
          topNotes.add(noteName);
        } else if ((noteType == 'MIDDLE' || noteType == 'HEART') &&
            !heartNotes.contains(noteName)) {
          heartNotes.add(noteName);
        } else if (noteType == 'BASE' && !baseNotes.contains(noteName)) {
          baseNotes.add(noteName);
        }
      }
    }

    if (topNotes.isEmpty && heartNotes.isEmpty && baseNotes.isEmpty) {
      if (parsedNotes.length == 1) {
        topNotes.add(parsedNotes.first);
      } else if (parsedNotes.length == 2) {
        topNotes.add(parsedNotes[0]);
        heartNotes.add(parsedNotes[1]);
      } else if (parsedNotes.length > 2) {
        final topEnd = (parsedNotes.length / 3).ceil();
        final heartEnd = ((parsedNotes.length * 2) / 3).ceil();

        topNotes.addAll(parsedNotes.sublist(0, topEnd));
        heartNotes.addAll(parsedNotes.sublist(topEnd, heartEnd));
        baseNotes.addAll(parsedNotes.sublist(heartEnd));
      }
    }

    final dynamic reviewsRaw = json['reviews'];
    final int? reviewCount = json['reviews'] is int
        ? json['reviews'] as int
        : (reviewsRaw is List ? reviewsRaw.length : null);

    double? rating;
    if (json['rating'] is num) {
      rating = (json['rating'] as num).toDouble();
    } else if (reviewsRaw is List && reviewsRaw.isNotEmpty) {
      double sum = 0;
      int count = 0;
      for (final item in reviewsRaw) {
        if (item is Map<String, dynamic> && item['rating'] is num) {
          sum += (item['rating'] as num).toDouble();
          count++;
        }
      }
      if (count > 0) rating = sum / count;
    }

    final dynamic priceRaw = json['price'] ?? firstVariant?.price;
    final double price = priceRaw is num ? priceRaw.toDouble() : 0;

    final dynamic stockRaw = json['in_stock'];
    final bool inStock = stockRaw is bool
        ? stockRaw
        : parsedVariants.any((v) => v.stock > 0 && v.isActive);

    final String imageUrl = (json['image_url']?.toString().isNotEmpty ?? false)
        ? json['image_url'] as String
        : (imageList.isNotEmpty ? imageList.first : '');

    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      brand: brandName,
      price: price,
      imageUrl: imageUrl,
      description: json['description'] as String?,
      story: json['story'] as String?,
      rating: rating,
      reviews: reviewCount,
      notes: parsedNotes,
      topNotes: topNotes,
      heartNotes: heartNotes,
      baseNotes: baseNotes,
      size: (json['size'] as String?) ?? firstVariant?.name,
      variant: (json['variant'] as String?) ?? firstVariant?.name,
      variants: parsedVariants,
      inStock: inStock,
      images: imageList,
    );
  }
}
