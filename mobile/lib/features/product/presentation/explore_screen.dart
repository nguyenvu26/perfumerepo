import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_async_widget.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../providers/product_provider.dart';
import '../../wishlist/providers/wishlist_provider.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);
    final wishlistAsync = ref.watch(wishlistProvider);
    final wishlistIds = wishlistAsync.value?.map((p) => p.id).toSet() ?? {};

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: GestureDetector(
                onTap: () => context.push('/search'),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.search,
                        color: AppTheme.mutedSilver.withValues(alpha: 0.6),
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Tìm thương hiệu, nốt hương hoặc cảm xúc...',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.montserrat(
                            fontSize: 13,
                            fontWeight: FontWeight.w400,
                            color: AppTheme.mutedSilver.withValues(alpha: 0.7),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Products Grid
            Expanded(
              child: AppAsyncWidget(
                value: productsAsync,
                onRetry: () => ref.invalidate(productsProvider),
                loadingBuilder: () => SingleChildScrollView(
                  child: ShimmerProductGrid(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 8,
                    ),
                  ),
                ),
                dataBuilder: (products) => GridView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 8,
                  ),
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
                      badge: (product.rating ?? 0) >= 4.9
                          ? 'ĐÁNH GIÁ CAO'
                          : null,
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
        ),
      ),
    );
  }
}
