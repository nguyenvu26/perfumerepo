import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../providers/cart_provider.dart';
import '../../providers/promotions_provider.dart';

class PromoCodeSection extends ConsumerStatefulWidget {
  final TextEditingController controller;
  final bool hasPromoCode;
  final String? promoCode;
  final double promoDiscount;
  final bool isLoading;

  const PromoCodeSection({
    super.key,
    required this.controller,
    required this.hasPromoCode,
    this.promoCode,
    required this.promoDiscount,
    required this.isLoading,
  });

  @override
  ConsumerState<PromoCodeSection> createState() => _PromoCodeSectionState();
}

class _PromoCodeSectionState extends ConsumerState<PromoCodeSection>
    with SingleTickerProviderStateMixin {
  bool _isExpanded = false;
  late final AnimationController _animController;
  late final Animation<double> _expandAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _expandAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() => _isExpanded = !_isExpanded);
    _isExpanded ? _animController.forward() : _animController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.hasPromoCode && widget.promoCode != null) {
      return _buildApplied();
    }
    return _buildExpandable();
  }

  Widget _buildApplied() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.accentGold.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.local_offer_rounded,
              color: AppTheme.accentGold,
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.promoCode!.toUpperCase(),
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.accentGold,
                  ),
                ),
                Text(
                  'Giảm ${(widget.promoDiscount * 100).toInt()}% đã được áp dụng',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(
              Icons.close_rounded,
              size: 18,
              color: AppTheme.mutedSilver,
            ),
            onPressed: () => ref.read(cartProvider.notifier).removePromoCode(),
            tooltip: 'Xóa mã',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Widget _buildExpandable() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          InkWell(
            onTap: _toggle,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  const Icon(
                    Icons.local_offer_outlined,
                    color: AppTheme.accentGold,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Bạn có mã khuyến mãi?',
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                  ),
                  AnimatedRotation(
                    duration: const Duration(milliseconds: 250),
                    turns: _isExpanded ? 0.5 : 0,
                    child: const Icon(
                      Icons.keyboard_arrow_down,
                      color: AppTheme.accentGold,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SizeTransition(
            sizeFactor: _expandAnim,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: widget.controller,
                          textCapitalization: TextCapitalization.characters,
                          decoration: InputDecoration(
                            hintText: 'Nhập mã giảm giá',
                            hintStyle: GoogleFonts.montserrat(
                              fontSize: 13,
                              color: AppTheme.mutedSilver,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            filled: true,
                            fillColor: AppTheme.ivoryBackground,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide.none,
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(
                                color: AppTheme.accentGold.withValues(
                                  alpha: 0.5,
                                ),
                              ),
                            ),
                          ),
                          style: GoogleFonts.montserrat(
                            fontSize: 13,
                            color: AppTheme.deepCharcoal,
                          ),
                          onSubmitted: (code) {
                            if (code.isNotEmpty) {
                              ref
                                  .read(cartProvider.notifier)
                                  .applyPromoCode(code);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      SizedBox(
                        height: 46,
                        child: ElevatedButton(
                          onPressed: widget.isLoading
                              ? null
                              : () {
                                  if (widget.controller.text.isNotEmpty) {
                                    ref
                                        .read(cartProvider.notifier)
                                        .applyPromoCode(widget.controller.text);
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.accentGold,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 18),
                          ),
                          child: widget.isLoading
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  'Áp dụng',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildPublicPromos(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPublicPromos() {
    final promosAsync = ref.watch(activePromotionsProvider);
    return promosAsync.when(
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(8),
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (promos) {
        if (promos.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'MÃ KHUYẾN MÃI CÓ SẴN',
              style: GoogleFonts.montserrat(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: AppTheme.mutedSilver,
              ),
            ),
            const SizedBox(height: 12),
            ...promos.map(
              (promo) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _buildPromoItem(promo.code, promo.displayDescription),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPromoItem(String code, String desc) {
    return InkWell(
      onTap: () {
        widget.controller.text = code;
        ref.read(cartProvider.notifier).applyPromoCode(code);
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: AppTheme.accentGold.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              child: Text(
                code,
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.accentGold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                desc,
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ),
            const Icon(
              Icons.chevron_right,
              size: 20,
              color: AppTheme.mutedSilver,
            ),
          ],
        ),
      ),
    );
  }
}
