import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/cart_provider.dart';
import '../providers/cart_selection_provider.dart';
import 'widgets/cart_item_tile.dart';
import 'widgets/cart_summary_section.dart';
import 'widgets/clear_cart_modal.dart';
import 'widgets/price_summary.dart';
import 'widgets/promo_code_section.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  bool _showAIBanner = true;
  final TextEditingController _promoController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Defer initial selection sync to after the first build frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final items = ref.read(cartProvider).items;
      if (items.isNotEmpty) {
        ref
            .read(cartSelectionProvider.notifier)
            .initFromCart(items.map((e) => e.id).toList());
      }
    });
  }

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cartState = ref.watch(cartProvider);
    final selection = ref.watch(cartSelectionProvider);

    // Initialize selection when cart loads — deferred to avoid modifying
    // a provider while the widget tree is building.
    ref.listen<CartState>(cartProvider, (previous, next) {
      if (next.items.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ref
                .read(cartSelectionProvider.notifier)
                .initFromCart(next.items.map((e) => e.id).toList());
          }
        });
      }
    });

    final selectedSubtotal = cartState.items
        .where((item) => selection.selectedIds.contains(item.id))
        .fold(0.0, (sum, item) => sum + item.subtotal);
    final selectedDiscount = selectedSubtotal * cartState.promoDiscount;
    final total = selectedSubtotal - selectedDiscount;

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2),
      appBar: _buildAppBar(cartState, selection),
      body: cartState.isLoading && cartState.items.isEmpty
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.accentGold),
            )
          : cartState.items.isEmpty
          ? _buildEmptyCart()
          : Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    children: [
                      // AI Upsell Banner (dismissible)
                      if (_showAIBanner) ...[
                        _AIUpsellBanner(
                          onDismiss: () =>
                              setState(() => _showAIBanner = false),
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Cart Items
                      ...cartState.items.map((item) {
                        return CartItemTile(
                          item: item,
                          isSelected: selection.selectedIds.contains(item.id),
                          onSelectChanged: (selected) {
                            ref
                                .read(cartSelectionProvider.notifier)
                                .toggle(item.id, cartState.items.length);
                          },
                          onQuantityChanged: (quantity) {
                            ref
                                .read(cartProvider.notifier)
                                .updateQuantity(item.id, quantity);
                          },
                          onRemove: () {
                            ref.read(cartProvider.notifier).removeItem(item.id);
                            ref
                                .read(cartSelectionProvider.notifier)
                                .removeId(item.id);
                          },
                        );
                      }),

                      const SizedBox(height: 12),

                      // Promo Code Section
                      PromoCodeSection(
                        controller: _promoController,
                        hasPromoCode: cartState.promoCode != null,
                        promoCode: cartState.promoCode,
                        promoDiscount: cartState.promoDiscount,
                        isLoading: cartState.isLoading,
                      ),

                      const SizedBox(height: 12),

                      // Price Breakdown
                      if (selection.selectedIds.isNotEmpty)
                        PriceSummary(
                          subtotal: selectedSubtotal,
                          discount: selectedDiscount,
                          total: total,
                        ),

                      const SizedBox(height: 16),
                    ],
                  ),
                ),

                // Sticky Checkout CTA
                CartSummarySection(
                  cartState: cartState,
                  selectedItems: selection.selectedIds,
                ),
              ],
            ),
    );
  }

  PreferredSizeWidget _buildAppBar(
    CartState cartState,
    CartSelectionState selection,
  ) {
    return AppBar(
      backgroundColor: const Color(0xFFFAF7F2),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(
          Icons.arrow_back,
          size: 20,
          color: AppTheme.deepCharcoal,
        ),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        'Gio hang (${cartState.items.length})',
        style: GoogleFonts.playfairDisplay(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppTheme.deepCharcoal,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            ref
                .read(cartSelectionProvider.notifier)
                .toggleAll(cartState.items.map((e) => e.id).toList());
          },
          child: Text(
            selection.selectAll ? 'Bo chon het' : 'Chon tat ca',
            style: GoogleFonts.montserrat(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppTheme.deepCharcoal,
            ),
          ),
        ),
        TextButton(
          onPressed: () {
            showClearCartModal(
              context,
              onClearConfirmed: () {
                ref.read(cartProvider.notifier).clearCart();
                ref.read(cartSelectionProvider.notifier).clear();
                Navigator.pop(context);
              },
            );
          },
          child: Text(
            'Xoa tat ca',
            style: GoogleFonts.montserrat(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppTheme.accentGold,
            ),
          ),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.shopping_bag_outlined,
              size: 72,
              color: AppTheme.mutedSilver.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 24),
            Text(
              'Gio hang dang trong',
              style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Kham pha bo suu tap nuoc hoa cao cap',
              style: GoogleFonts.montserrat(
                fontSize: 13,
                color: AppTheme.mutedSilver,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accentGold,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                child: Text(
                  'Kham pha ngay',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AIUpsellBanner extends StatelessWidget {
  final VoidCallback onDismiss;

  const _AIUpsellBanner({required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.accentGold.withValues(alpha: 0.08),
            AppTheme.champagneGold.withValues(alpha: 0.12),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.auto_awesome,
              size: 18,
              color: AppTheme.accentGold,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Goi y tu PerfumeGPT',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.accentGold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Them mau thu Golden Amber de trai nghiem tron ven hon.',
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.deepCharcoal,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onDismiss,
            child: const Icon(
              Icons.close,
              size: 16,
              color: AppTheme.mutedSilver,
            ),
          ),
        ],
      ),
    );
  }
}
