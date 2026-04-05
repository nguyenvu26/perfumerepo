import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../providers/cart_provider.dart';

class CartSummarySection extends StatelessWidget {
  final CartState cartState;
  final Set<String> selectedItems;

  const CartSummarySection({
    super.key,
    required this.cartState,
    required this.selectedItems,
  });

  double get selectedSubtotal {
    return cartState.items
        .where((item) => selectedItems.contains(item.id))
        .fold(0.0, (sum, item) => sum + item.subtotal);
  }

  double get selectedDiscount => selectedSubtotal * cartState.promoDiscount;
  double get total => selectedSubtotal - selectedDiscount;

  @override
  Widget build(BuildContext context) {
    final hasSelection = selectedItems.isNotEmpty;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Builder(
            builder: (context) => GestureDetector(
              onTap: hasSelection
                  ? () => context.push(AppRoutes.checkout)
                  : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                height: 52,
                decoration: BoxDecoration(
                  color: hasSelection
                      ? AppTheme.accentGold
                      : AppTheme.mutedSilver.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      hasSelection
                          ? 'Thanh toán'
                          : 'Chọn sản phẩm để thanh toán',
                      style: GoogleFonts.montserrat(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: hasSelection
                            ? Colors.white
                            : AppTheme.mutedSilver,
                      ),
                    ),
                    if (hasSelection) ...[
                      Text(
                        '  •  ${formatVND(total)}',
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        size: 18,
                        color: Colors.white,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
