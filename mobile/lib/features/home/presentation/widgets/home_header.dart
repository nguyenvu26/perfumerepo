import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Actions
          Row(
            children: [
              Builder(
                builder: (context) => _IconButton(
                  icon: Icons.menu,
                  onTap: () => Scaffold.of(context).openDrawer(),
                ),
              ),
              const Spacer(),
              _IconButton(
                icon: Icons.favorite_border,
                onTap: () => context.push('/wishlist'),
              ),
              const SizedBox(width: 16),
              _IconButton(
                icon: Icons.shopping_bag_outlined,
                onTap: () => context.push('/cart'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Search Bar
          GestureDetector(
            onTap: () => context.push('/search'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
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
          const SizedBox(height: 28),

          // Headline
          RichText(
            text: TextSpan(
              style: GoogleFonts.playfairDisplay(
                fontSize: 32,
                fontWeight: FontWeight.w400,
                height: 1.3,
                color: AppTheme.deepCharcoal,
              ),
              children: [
                const TextSpan(text: 'Nâng tầm '),
                TextSpan(
                  text: 'dấu ấn',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 32,
                    fontWeight: FontWeight.w400,
                    fontStyle: FontStyle.italic,
                    color: AppTheme.accentGold,
                  ),
                ),
                const TextSpan(text: '\nhương riêng của bạn'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _IconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _IconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, color: AppTheme.deepCharcoal, size: 24),
      ),
    );
  }
}
