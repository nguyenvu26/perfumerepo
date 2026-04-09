import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';

/// Base shimmer placeholder with a sweeping gradient animation.
///
/// Usage:
/// ```dart
/// ShimmerBox(width: 120, height: 16)
/// ShimmerBox(height: 200, borderRadius: AppRadius.md)
/// ```
class ShimmerBox extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = 4,
  });

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? Colors.grey.shade800 : AppTheme.softTaupe;
    final highlightColor = isDark ? Colors.grey.shade700 : AppTheme.creamWhite;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = _controller.value;
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(-1.0 + 2.0 * t, 0),
              end: Alignment(1.0 + 2.0 * t, 0),
              colors: [baseColor, highlightColor, baseColor],
            ),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Pre-built skeleton variants
// ---------------------------------------------------------------------------

/// 2-column product grid skeleton.
///
/// Drop-in replacement for loading state of product grids.
/// ```dart
/// productsAsync.when(
///   loading: () => const ShimmerProductGrid(),
///   ...
/// )
/// ```
class ShimmerProductGrid extends StatelessWidget {
  final int itemCount;
  final EdgeInsetsGeometry? padding;

  const ShimmerProductGrid({super.key, this.itemCount = 6, this.padding});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: padding ?? AppSpacing.screenAll,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.54,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: itemCount,
      itemBuilder: (_, __) => const _ShimmerProductCard(),
    );
  }
}

class _ShimmerProductCard extends StatelessWidget {
  const _ShimmerProductCard();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AspectRatio(
          aspectRatio: 1.1,
          child: ShimmerBox(
            height: double.infinity,
            borderRadius: AppRadius.md,
          ),
        ),
        AppSpacing.vertXs,
        const ShimmerBox(height: 10, width: 70),
        AppSpacing.vertXxs,
        const ShimmerBox(height: 14),
        AppSpacing.vertXxs,
        const ShimmerBox(height: 12, width: 60),
      ],
    );
  }
}

/// Single list-tile skeleton.
///
/// Use inside a Column or ListView for list loading states.
/// ```dart
/// Column(children: List.generate(5, (_) => const ShimmerListTile()))
/// ```
class ShimmerListTile extends StatelessWidget {
  const ShimmerListTile({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      child: Row(
        children: [
          ShimmerBox(width: 48, height: 48, borderRadius: AppRadius.sm),
          AppSpacing.horzSm,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                ShimmerBox(height: 14),
                SizedBox(height: 6),
                ShimmerBox(height: 11, width: 120),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Full-width card skeleton — for alert cards, order cards, etc.
class ShimmerCard extends StatelessWidget {
  final double height;

  const ShimmerCard({super.key, this.height = 100});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      child: ShimmerBox(height: height, borderRadius: AppRadius.md),
    );
  }
}
