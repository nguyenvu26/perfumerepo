import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class ProductBottomCTA extends StatelessWidget {
  final String selectedSize;
  final double price;
  final String productName;
  final Future<void> Function()? onAddToCart;
  final Future<void> Function()? onBuyNow;

  const ProductBottomCTA({
    super.key,
    required this.selectedSize,
    required this.price,
    required this.productName,
    this.onAddToCart,
    this.onBuyNow,
  });

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.09),
            blurRadius: 24,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Action buttons ──────────────────────────────────────────
          Row(
            children: [
              // Cart icon (add to cart)
              _CartIconButton(
                onPressed:
                    onAddToCart ??
                    () async {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Đã thêm $productName vào giỏ hàng'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
              ),
              const SizedBox(width: 12),
              // Primary: Buy Now
              Expanded(
                child: _AnimatedButton(
                  onPressed: () async {
                    if (onBuyNow != null) {
                      await onBuyNow!();
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Đang chuyển sang thanh toán'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  isPrimary: true,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      'Mua ngay',
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          // ── Trust signal ────────────────────────────────────────────
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.loop, size: 11, color: AppTheme.mutedSilver),
              const SizedBox(width: 4),
              Text(
                'Miễn phí đổi trả trong 14 ngày',
                style: GoogleFonts.montserrat(
                  fontSize: 10,
                  color: AppTheme.mutedSilver,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AnimatedButton extends StatefulWidget {
  final Future<void> Function() onPressed;
  final Widget child;
  final bool isPrimary;

  const _AnimatedButton({
    required this.onPressed,
    required this.child,
    required this.isPrimary,
  });

  @override
  State<_AnimatedButton> createState() => _AnimatedButtonState();
}

class _AnimatedButtonState extends State<_AnimatedButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.96,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: SizedBox(
        height: 48,
        child: widget.isPrimary
            ? ElevatedButton(
                onPressed: () async {
                  await _controller.forward();
                  await _controller.reverse();
                  await widget.onPressed();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accentGold,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: widget.child,
              )
            : OutlinedButton(
                onPressed: () async {
                  await _controller.forward();
                  await _controller.reverse();
                  await widget.onPressed();
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.accentGold,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  side: const BorderSide(
                    color: AppTheme.accentGold,
                    width: 1.5,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: widget.child,
              ),
      ),
    );
  }
}

class _CartIconButton extends StatefulWidget {
  final Future<void> Function() onPressed;
  const _CartIconButton({required this.onPressed});

  @override
  State<_CartIconButton> createState() => _CartIconButtonState();
}

class _CartIconButtonState extends State<_CartIconButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scale = Tween<double>(
      begin: 1.0,
      end: 0.92,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: SizedBox(
        width: 52,
        height: 48,
        child: OutlinedButton(
          onPressed: () async {
            await _controller.forward();
            await _controller.reverse();
            await widget.onPressed();
          },
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.accentGold,
            padding: EdgeInsets.zero,
            side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Icon(Icons.shopping_bag_outlined, size: 22),
        ),
      ),
    );
  }
}
