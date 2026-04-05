import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../models/cart_item.dart';

class CartItemTile extends StatelessWidget {
  final CartItem item;
  final bool isSelected;
  final ValueChanged<bool> onSelectChanged;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onRemove;

  const CartItemTile({
    super.key,
    required this.item,
    required this.isSelected,
    required this.onSelectChanged,
    required this.onQuantityChanged,
    required this.onRemove,
  });

  bool get isSample => item.price == 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Dismissible(
        key: Key('cart-item-${item.id}'),
        direction: DismissDirection.endToStart,
        background: _SwipeBg(),
        onDismissed: (_) {
          HapticFeedback.mediumImpact();
          onRemove();
        },
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _Checkbox(
                isSelected: isSelected,
                onTap: () => onSelectChanged(!isSelected),
              ),
              const SizedBox(width: 10),
              _ProductImage(imageUrl: item.productImage),
              const SizedBox(width: 12),
              Expanded(
                child: _ProductDetails(
                  item: item,
                  isSample: isSample,
                  onQuantityChanged: onQuantityChanged,
                  onRemove: onRemove,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SwipeBg extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.centerRight,
      padding: const EdgeInsets.only(right: 24),
      decoration: BoxDecoration(
        color: const Color(0xFFFF4444),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.delete_outline_rounded, color: Colors.white, size: 26),
          SizedBox(height: 4),
          Text(
            'Xóa',
            style: TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _Checkbox extends StatelessWidget {
  final bool isSelected;
  final VoidCallback onTap;

  const _Checkbox({required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentGold : Colors.transparent,
          shape: BoxShape.circle,
          border: Border.all(
            color: isSelected ? AppTheme.accentGold : AppTheme.softTaupe,
            width: 1.5,
          ),
        ),
        child: isSelected
            ? const Icon(Icons.check, color: Colors.white, size: 14)
            : null,
      ),
    );
  }
}

class _ProductImage extends StatelessWidget {
  final String imageUrl;
  const _ProductImage({required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 76,
        height: 76,
        color: AppTheme.ivoryBackground,
        child: Image.network(
          imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => const Center(
            child: Icon(
              Icons.image_outlined,
              color: AppTheme.mutedSilver,
              size: 28,
            ),
          ),
        ),
      ),
    );
  }
}

class _ProductDetails extends StatelessWidget {
  final CartItem item;
  final bool isSample;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onRemove;

  const _ProductDetails({
    required this.item,
    required this.isSample,
    required this.onQuantityChanged,
    required this.onRemove,
  });

  bool get _hasVariantInfo =>
      (item.variant ?? '').isNotEmpty || (item.size ?? '').isNotEmpty;

  String get _variantInfo {
    final parts = <String>[];
    final v = item.variant ?? '';
    final s = item.size ?? '';
    
    if (v.isNotEmpty) parts.add(v);
    if (s.isNotEmpty && s != v) parts.add(s);
    
    return parts.join(' • ');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                item.productName,
                style: GoogleFonts.playfairDisplay(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isSample) ...[const SizedBox(width: 6), const _SampleBadge()],
          ],
        ),
        if (_hasVariantInfo) ...[
          const SizedBox(height: 3),
          Text(
            _variantInfo,
            style: GoogleFonts.montserrat(
              fontSize: 11,
              color: AppTheme.mutedSilver,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        const SizedBox(height: 8),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              isSample ? 'Miễn phí' : formatVND(item.price),
              style: GoogleFonts.montserrat(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.accentGold,
              ),
            ),
            const Spacer(),
            _InlineQty(
              quantity: item.quantity,
              canDecrease: item.quantity > 1,
              canIncrease: !isSample || item.quantity < 1,
              onDecrease: () => onQuantityChanged(item.quantity - 1),
              onIncrease: () => onQuantityChanged(item.quantity + 1),
            ),
          ],
        ),
      ],
    );
  }
}

class _SampleBadge extends StatelessWidget {
  const _SampleBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppTheme.accentGold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        'MẪU THỬ',
        style: GoogleFonts.montserrat(
          fontSize: 8,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: AppTheme.accentGold,
        ),
      ),
    );
  }
}

class _InlineQty extends StatelessWidget {
  final int quantity;
  final bool canDecrease;
  final bool canIncrease;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;

  const _InlineQty({
    required this.quantity,
    required this.canDecrease,
    required this.canIncrease,
    required this.onDecrease,
    required this.onIncrease,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 32,
      decoration: BoxDecoration(
        color: AppTheme.ivoryBackground,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _QtyBtn(
            icon: Icons.remove,
            active: canDecrease,
            onTap: canDecrease ? onDecrease : null,
          ),
          SizedBox(
            width: 28,
            child: Center(
              child: Text(
                '$quantity',
                style: GoogleFonts.montserrat(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ),
          ),
          _QtyBtn(
            icon: Icons.add,
            active: canIncrease,
            onTap: canIncrease ? onIncrease : null,
          ),
        ],
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final bool active;
  final VoidCallback? onTap;

  const _QtyBtn({
    required this.icon,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        width: 30,
        height: 32,
        child: Icon(
          icon,
          size: 14,
          color: active ? AppTheme.deepCharcoal : AppTheme.mutedSilver,
        ),
      ),
    );
  }
}
