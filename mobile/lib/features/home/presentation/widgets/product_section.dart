import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/product_card.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../product/models/product.dart';
import '../../../wishlist/providers/wishlist_provider.dart';

class ProductSection extends ConsumerWidget {
  final String title;
  final String? actionText;
  final AsyncValue<List<Product>> productsAsync;

  const ProductSection({
    super.key,
    required this.title,
    this.actionText,
    required this.productsAsync,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlistAsync = ref.watch(wishlistProvider);
    final wishlistIds = wishlistAsync.value?.map((p) => p.id).toSet() ?? {};

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SectionHeader(
            title: title,
            onViewAll: () => context.push('/explore'),
            showViewAll: actionText != null,
          ),
        ),
        productsAsync.when(
          loading: () => SingleChildScrollView(
            child: ShimmerProductGrid(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            ),
          ),
          error: (error, stack) => const SizedBox(
            height: 200,
            child: Center(child: Text('Không thể tải dữ liệu')),
          ),
          data: (products) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.only(top: 8),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.60,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final product = products[index];
                final isFav = wishlistIds.contains(product.id);
                return ProductCard(
                  product: product,
                  variant: ProductCardVariant.grid,
                  badge: 'AI TUYỂN CHỌN',
                  isFavorite: isFav,
                  onTap: () => context.push('/product/${product.id}'),
                  onFavoriteToggle: () {
                    ref.read(wishlistProvider.notifier).toggle(product);
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
