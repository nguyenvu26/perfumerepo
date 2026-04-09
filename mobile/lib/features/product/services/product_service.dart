import '../models/product.dart';

class ProductService {
  // Mock products for development
  final List<Product> _mockProducts = [
    Product(
      id: '1',
      name: 'Velvet Sandalwood',
      brand: 'Atelier',
      price: 295.00,
      imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
      description: 'Sandalwood, Iris, Musk, Amber',
      rating: 4.8,
      reviews: 128,
      notes: ['Sandalwood', 'Iris', 'Musk', 'Amber'],
      inStock: true,
    ),
    Product(
      id: '2',
      name: 'Midnight Rose',
      brand: 'Maison',
      price: 325.00,
      imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800',
      description: 'Rose, Patchouli, Oud, Vanilla',
      rating: 4.9,
      reviews: 256,
      notes: ['Rose', 'Patchouli', 'Oud', 'Vanilla'],
      inStock: true,
    ),
    Product(
      id: '3',
      name: 'N°5 Eau de Parfum',
      brand: 'Chanel',
      price: 135.00,
      imageUrl: 'https://images.unsplash.com/photo-1592428122542-615e40d70d7a?w=800',
      description: 'Aldehydes, Ylang-Ylang, Neroli',
      rating: 5.0,
      reviews: 1024,
      notes: ['Aldehydes', 'Ylang-Ylang', 'Neroli', 'Jasmine'],
      inStock: true,
    ),
    Product(
      id: '4',
      name: 'Santal 33',
      brand: 'Le Labo',
      price: 215.00,
      imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800',
      description: 'Cardamom, Iris, Violet, Ambrox',
      rating: 4.7,
      reviews: 512,
      notes: ['Sandalwood', 'Cardamom', 'Iris', 'Violet'],
      inStock: true,
    ),
    Product(
      id: '5',
      name: 'Libre Eau de Parfum',
      brand: 'Yves Saint Laurent',
      price: 95.00,
      imageUrl: 'https://images.unsplash.com/photo-1547887538-047f814bfb10?w=800',
      description: 'Lavender, Orange Blossom, Musk',
      rating: 4.6,
      reviews: 342,
      notes: ['Lavender', 'Orange Blossom', 'Musk', 'Vanilla'],
      inStock: true,
    ),
    Product(
      id: '6',
      name: 'Gypsy Water',
      brand: 'Byredo',
      price: 205.00,
      imageUrl: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800',
      description: 'Pine Needle, Sandalwood, Lemon',
      rating: 4.8,
      reviews: 287,
      notes: ['Pine Needle', 'Sandalwood', 'Lemon', 'Amber'],
      inStock: true,
    ),
    Product(
      id: '7',
      name: 'Oud Wood Intense',
      brand: 'Tom Ford',
      price: 295.00,
      imageUrl: 'https://images.unsplash.com/photo-1619994737967-d3e5e9478c85?w=800',
      description: 'Oud, Rosewood, Cardamom, Amber',
      rating: 4.9,
      reviews: 421,
      notes: ['Oud', 'Rosewood', 'Cardamom', 'Amber'],
      inStock: true,
    ),
    Product(
      id: '8',
      name: 'Moody Hues',
      brand: 'Maison',
      price: 245.00,
      imageUrl: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800',
      description: 'Jasmine, Wet Earth, Moss',
      rating: 4.7,
      reviews: 198,
      notes: ['Jasmine', 'Wet Earth', 'Moss', 'Cedarwood'],
      inStock: true,
    ),
  ];

  Future<List<Product>> getAllProducts() async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    return _mockProducts;
  }

  Future<List<Product>> getPersonalizedProducts() async {
    await Future.delayed(const Duration(milliseconds: 400));
    // Return first 3 products as personalized
    return _mockProducts.take(3).toList();
  }

  Future<List<Product>> getRecommendedProducts() async {
    await Future.delayed(const Duration(milliseconds: 400));
    // Return products 3-6 as recommended
    return _mockProducts.skip(3).take(4).toList();
  }

  Future<Product> getProductById(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _mockProducts.firstWhere(
      (product) => product.id == id,
      orElse: () => _mockProducts.first,
    );
  }

  Future<List<Product>> searchProducts(String query) async {
    await Future.delayed(const Duration(milliseconds: 300));
    if (query.isEmpty) return _mockProducts;
    
    final lowerQuery = query.toLowerCase();
    return _mockProducts.where((product) {
      return product.name.toLowerCase().contains(lowerQuery) ||
             product.brand.toLowerCase().contains(lowerQuery) ||
             product.notes.any((note) => note.toLowerCase().contains(lowerQuery));
    }).toList();
  }
}
