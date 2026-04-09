import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_async_widget.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../providers/wishlist_provider.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Yêu thích',
          style: GoogleFonts.playfairDisplay(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: AppTheme.deepCharcoal,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.deepCharcoal),
          onPressed: () => context.pop(),
        ),
      ),
      body: AppAsyncWidget(
        value: ref.watch(wishlistProvider),
        onRetry: () => ref.invalidate(wishlistProvider),
        loadingBuilder: () => SingleChildScrollView(
          child: ShimmerProductGrid(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          ),
        ),
        dataBuilder: (wishlist) => wishlist.isNotEmpty
            ? GridView.builder(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.54,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: wishlist.length,
                itemBuilder: (context, index) {
                  final product = wishlist[index];
                  return ProductCard(
                    product: product,
                    variant: ProductCardVariant.grid,
                    isFavorite: true,
                    onTap: () => context.push('/product/${product.id}'),
                    onFavoriteToggle: () {
                      ref.read(wishlistProvider.notifier).toggle(product);
                    },
                  );
                },
              )
            : _buildEmptyState(context),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.favorite_border,
              size: 64,
              color: AppTheme.mutedSilver.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 24),
            Text(
              'Danh sách yêu thích đang chờ\nmùi hương bạn thật sự yêu.',
              textAlign: TextAlign.center,
              style: GoogleFonts.playfairDisplay(
                fontSize: 20,
                fontWeight: FontWeight.w400,
                height: 1.4,
                color: AppTheme.deepCharcoal.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 40),
            OutlinedButton(
              onPressed: () => context.go('/explore'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 14,
                ),
                side: BorderSide(
                  color: AppTheme.accentGold.withValues(alpha: 0.5),
                  width: 1,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
              child: Text(
                'Khám phá nước hoa',
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.accentGold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
