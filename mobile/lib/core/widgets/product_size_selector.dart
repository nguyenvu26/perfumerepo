import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class ProductSizeSelector extends StatefulWidget {
  final String selectedSize;
  final List<String>? sizes;
  final ValueChanged<String> onSizeChanged;

  const ProductSizeSelector({
    super.key,
    required this.selectedSize,
    this.sizes,
    required this.onSizeChanged,
  });

  @override
  State<ProductSizeSelector> createState() => _ProductSizeSelectorState();
}

class _ProductSizeSelectorState extends State<ProductSizeSelector> {
  List<String> get _sizes {
    final dynamicSizes = widget.sizes;
    if (dynamicSizes != null && dynamicSizes.isNotEmpty) {
      return dynamicSizes;
    }
    return const ['10ml', '20ml', '50ml', '100ml'];
  }

  String? _labelFor(String size) {
    if (widget.sizes != null && widget.sizes!.isNotEmpty) return null;
    if (size == '10ml') return 'DÙNG THỬ';
    if (size == '100ml') return 'TIẾT KIỆM NHẤT';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final sizes = _sizes;

    return Transform.translate(
      offset: const Offset(0, -30),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chọn dung tích',
              style: GoogleFonts.montserrat(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                for (var i = 0; i < sizes.length; i++) ...[
                  Expanded(
                    child: _SizeOption(
                      size: sizes[i],
                      label: _labelFor(sizes[i]),
                      isSelected: widget.selectedSize == sizes[i],
                      onTap: () => widget.onSizeChanged(sizes[i]),
                    ),
                  ),
                  if (i != sizes.length - 1) const SizedBox(width: 8),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SizeOption extends StatefulWidget {
  final String size;
  final String? label;
  final bool isSelected;
  final VoidCallback onTap;

  const _SizeOption({
    required this.size,
    this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_SizeOption> createState() => _SizeOptionState();
}

class _SizeOptionState extends State<_SizeOption>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: GestureDetector(
        onTapDown: (_) => _scaleController.forward(),
        onTapUp: (_) {
          _scaleController.reverse();
          widget.onTap();
        },
        onTapCancel: () => _scaleController.reverse(),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          height: 56,
          decoration: BoxDecoration(
            color: widget.isSelected
                ? AppTheme.accentGold.withValues(alpha: 0.08)
                : Colors.white,
            border: Border.all(
              color: widget.isSelected
                  ? AppTheme.accentGold
                  : const Color(0xFFE8E8E8),
              width: widget.isSelected ? 1.5 : 1,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.label != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    widget.label!,
                    style: GoogleFonts.montserrat(
                      fontSize: 6,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
              ],
              Text(
                widget.size,
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: widget.isSelected
                      ? AppTheme.accentGold
                      : AppTheme.deepCharcoal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
