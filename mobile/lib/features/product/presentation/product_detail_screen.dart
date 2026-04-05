import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/routing/app_routes.dart';
import '../../../core/widgets/floating_icon_button.dart';
import '../../../core/widgets/product_size_selector.dart';
import '../../../core/widgets/ai_scent_analysis_card.dart';
import '../../../core/widgets/scent_structure_section.dart';
import '../../../core/widgets/product_story_section.dart';
import '../../../core/widgets/product_bottom_cta.dart';
import '../../cart/providers/cart_provider.dart';
import '../../wishlist/providers/wishlist_provider.dart';
import 'scent_structure_detail_screen.dart';
import '../providers/product_provider.dart';
import '../models/product.dart';
import '../../../core/widgets/product_price_section.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen>
    with SingleTickerProviderStateMixin {
  bool _isAIAnalysisExpanded = false;
  String _selectedSize = '100ml';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  final PageController _pageController = PageController();
  int _currentImagePage = 0;

  // Size pricing map
  final Map<String, double> _sizePricing = {
    '10ml': 35.00,
    '20ml': 65.00,
    '50ml': 135.00,
    '100ml': 295.00,
  };

  ProductVariant? _findSelectedVariant(Product product, String selectedSize) {
    if (product.variants.isEmpty) return null;

    for (final variant in product.variants) {
      if (!variant.isActive) continue;
      if (variant.name.toLowerCase() == selectedSize.toLowerCase()) {
        return variant;
      }
    }

    for (final variant in product.variants) {
      if (variant.isActive) return variant;
    }

    return product.variants.first;
  }

  double _priceFor(Product product, String selectedSize) {
    final selectedVariant = _findSelectedVariant(product, selectedSize);
    if (selectedVariant != null) return selectedVariant.price;
    return _sizePricing[selectedSize] ?? product.price;
  }

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailProvider(widget.productId));
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: productAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.accentGold),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 48,
                color: AppTheme.mutedSilver,
              ),
              const SizedBox(height: 16),
              Text('Không thể tải sản phẩm', style: GoogleFonts.montserrat()),
            ],
          ),
        ),
        data: (product) {
          final images = (product.images != null && product.images!.isNotEmpty)
              ? product.images!
              : [product.imageUrl];
          final backendVariantSizes = product.variants
              .where((variant) => variant.isActive)
              .map((variant) => variant.name)
              .toList();
          final selectedSize = backendVariantSizes.contains(_selectedSize)
              ? _selectedSize
              : (backendVariantSizes.isNotEmpty
                    ? backendVariantSizes.first
                    : _selectedSize);
          final currentPrice = _priceFor(product, selectedSize);

          return Stack(
            children: [
              CustomScrollView(
                slivers: [
                  // ================= HERO IMAGE =================
                  SliverAppBar(
                    expandedHeight: screenHeight * 0.55,
                    pinned: false,
                    elevation: 0,
                    backgroundColor: Colors.transparent,
                    leading: FloatingIconButton(
                      icon: Icons.arrow_back,
                      onTap: () => context.pop(),
                    ),
                    actions: [
                      FloatingIconButton(
                        icon: Icons.share_outlined,
                        onTap: () {},
                      ),
                      const SizedBox(width: 8),
                      Consumer(
                        builder: (context, ref, _) {
                          final isFav =
                              ref
                                  .watch(wishlistProvider)
                                  .valueOrNull
                                  ?.any((p) => p.id == product.id) ??
                              false;
                          return FloatingIconButton(
                            icon: isFav
                                ? Icons.favorite
                                : Icons.favorite_border,
                            onTap: () => ref
                                .read(wishlistProvider.notifier)
                                .toggle(product),
                            isActive: isFav,
                          );
                        },
                      ),
                      const SizedBox(width: 16),
                    ],
                    flexibleSpace: FlexibleSpaceBar(
                      background: FadeTransition(
                        opacity: _fadeAnimation,
                        child: Hero(
                          tag: 'product-${product.id}',
                          child: ClipRRect(
                            borderRadius: const BorderRadius.only(
                              bottomLeft: Radius.circular(32),
                              bottomRight: Radius.circular(32),
                            ),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                // gradient background
                                Container(
                                  decoration: const BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        Color(0xFFE8D5B7),
                                        Color(0xFFF5F1ED),
                                      ],
                                    ),
                                  ),
                                ),
                                // swipeable image gallery
                                PageView.builder(
                                  controller: _pageController,
                                  onPageChanged: (i) =>
                                      setState(() => _currentImagePage = i),
                                  itemCount: images.length,
                                  itemBuilder: (_, i) => Image.network(
                                    images[i],
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => const Center(
                                      child: Icon(
                                        Icons.image_outlined,
                                        size: 64,
                                        color: AppTheme.mutedSilver,
                                      ),
                                    ),
                                  ),
                                ),
                                // indicator dots
                                if (images.length > 1)
                                  Positioned(
                                    bottom: 28,
                                    left: 0,
                                    right: 0,
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: List.generate(
                                        images.length,
                                        (i) => AnimatedContainer(
                                          duration: const Duration(
                                            milliseconds: 200,
                                          ),
                                          margin: const EdgeInsets.symmetric(
                                            horizontal: 3,
                                          ),
                                          width: i == _currentImagePage
                                              ? 18.0
                                              : 6.0,
                                          height: 6,
                                          decoration: BoxDecoration(
                                            color: i == _currentImagePage
                                                ? Colors.white
                                                : Colors.white.withValues(
                                                    alpha: 0.5,
                                                  ),
                                            borderRadius: BorderRadius.circular(
                                              3,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // ================= PRODUCT INFO CARD =================
                  SliverToBoxAdapter(
                    child: Transform.translate(
                      // Light overlap with hero bottom edge
                      offset: const Offset(0, -24),
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: Container(
                          margin: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                          padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                          decoration: BoxDecoration(
                            color: AppTheme.ivoryBackground,
                            borderRadius: BorderRadius.circular(28),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.10),
                                blurRadius: 32,
                                spreadRadius: 0,
                                offset: const Offset(0, 8),
                              ),
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 8,
                                spreadRadius: 0,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // BRAND
                              Text(
                                product.brand.toUpperCase(),
                                style: GoogleFonts.montserrat(
                                  fontSize: 10,
                                  letterSpacing: 1.5,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.accentGold,
                                ),
                              ),
                              const SizedBox(height: 6),
                              // NAME
                              Text(
                                product.name,
                                style: GoogleFonts.playfairDisplay(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w600,
                                  height: 1.15,
                                  color: AppTheme.deepCharcoal,
                                ),
                              ),
                              const SizedBox(height: 4),
                              // SUBTITLE
                              Text(
                                'Nước hoa Eau de Parfum',
                                style: GoogleFonts.montserrat(
                                  fontSize: 12,
                                  color: AppTheme.mutedSilver,
                                ),
                              ),
                              const SizedBox(height: 12),
                              // RATING + VIEW REVIEWS
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  if (product.rating != null) ...[
                                    const Icon(
                                      Icons.star,
                                      size: 14,
                                      color: AppTheme.accentGold,
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      '${product.rating}/5',
                                      style: GoogleFonts.montserrat(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.deepCharcoal,
                                      ),
                                    ),
                                    if (product.reviews != null) ...[
                                      const SizedBox(width: 4),
                                      Text(
                                        '· ${product.reviews} đánh giá',
                                        style: GoogleFonts.montserrat(
                                          fontSize: 11,
                                          color: AppTheme.mutedSilver,
                                        ),
                                      ),
                                    ],
                                  ] else
                                    Text(
                                      'Chưa có đánh giá',
                                      style: GoogleFonts.montserrat(
                                        fontSize: 11,
                                        color: AppTheme.mutedSilver,
                                      ),
                                    ),
                                  const Spacer(),
                                  GestureDetector(
                                    onTap: () => context.push(
                                      AppRoutes.reviewsWithProductId(
                                        product.id,
                                        productName: product.name,
                                      ),
                                    ),
                                    child: Text(
                                      'Xem review →',
                                      style: GoogleFonts.montserrat(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.accentGold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // ================= PRICE (above the fold) =================
                  SliverToBoxAdapter(
                    child: ProductPriceSection(price: currentPrice),
                  ),

                  // ================= SIZE SELECTOR =================
                  SliverToBoxAdapter(
                    child: ProductSizeSelector(
                      selectedSize: selectedSize,
                      sizes: backendVariantSizes.isEmpty
                          ? null
                          : backendVariantSizes,
                      onSizeChanged: (size) =>
                          setState(() => _selectedSize = size),
                    ),
                  ),

                  // ================= AI SCENT ANALYSIS =================
                  SliverToBoxAdapter(
                    child: AIScentAnalysisCard(
                      isExpanded: _isAIAnalysisExpanded,
                      onToggle: () => setState(
                        () => _isAIAnalysisExpanded = !_isAIAnalysisExpanded,
                      ),
                      notes: product.notes,
                    ),
                  ),

                  // ================= SCENT STRUCTURE =================
                  SliverToBoxAdapter(
                    child: ScentStructureSection(
                      notes: product.notes,
                      topNotes: product.topNotes,
                      heartNotes: product.heartNotes,
                      baseNotes: product.baseNotes,
                      onViewAll: () {
                        if (!mounted) return;
                        Navigator.of(context, rootNavigator: true).push(
                          PageRouteBuilder(
                            transitionDuration: const Duration(
                              milliseconds: 420,
                            ),
                            reverseTransitionDuration: const Duration(
                              milliseconds: 280,
                            ),
                            pageBuilder: (_, __, ___) =>
                                ScentStructureDetailScreen(
                                  productName: product.name,
                                  notes: product.notes,
                                  topNotes: product.topNotes,
                                  heartNotes: product.heartNotes,
                                  baseNotes: product.baseNotes,
                                ),
                            transitionsBuilder: (_, animation, __, child) {
                              final fade = CurvedAnimation(
                                parent: animation,
                                curve: Curves.easeOutCubic,
                              );
                              final scale = Tween<double>(begin: 0.985, end: 1)
                                  .animate(
                                    CurvedAnimation(
                                      parent: animation,
                                      curve: Curves.easeOut,
                                    ),
                                  );

                              return FadeTransition(
                                opacity: fade,
                                child: ScaleTransition(
                                  scale: scale,
                                  child: child,
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ),

                  // ================= THE STORY =================
                  const SliverToBoxAdapter(child: SizedBox(height: 40)),
                  SliverToBoxAdapter(
                    child: ProductStorySection(
                      description: product.description,
                      productId: product.id,
                      productName: product.name,
                      imageUrl: product.imageUrl,
                    ),
                  ),

                  // Bottom padding — space reserved for the sticky CTA overlay
                  const SliverToBoxAdapter(child: SizedBox(height: 110)),
                ],
              ),

              // ===================== STICKY CTA =====================
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: ProductBottomCTA(
                  selectedSize: selectedSize,
                  price: currentPrice,
                  productName: product.name,
                  onAddToCart: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    final variant = _findSelectedVariant(product, selectedSize);
                    if (variant == null || variant.id.isEmpty) {
                      if (!mounted) return;
                      messenger.showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Không tìm thấy phiên bản sản phẩm phù hợp.',
                          ),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                      return;
                    }

                    try {
                      await ref
                          .read(cartProvider.notifier)
                          .addItemByVariant(variant.id, quantity: 1);

                      if (!mounted) return;
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Đã thêm ${product.name} vào giỏ hàng'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    } catch (error) {
                      if (!mounted) return;
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Không thể thêm vào giỏ: $error'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    }
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
