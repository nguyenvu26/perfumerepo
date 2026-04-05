import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';

class TrackingMapCard extends StatelessWidget {
  final String label;

  const TrackingMapCard({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepCharcoal.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Map visual area ──
          AspectRatio(
            aspectRatio: 2.1,
            child: Container(
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFF8F2EB), Color(0xFFEDE3D8)],
                ),
              ),
              child: Stack(
                children: [
                  // Subtle route path lines
                  CustomPaint(size: Size.infinite, painter: _RoutePainter()),
                  // Origin dot
                  Positioned(
                    top: 28,
                    left: 32,
                    child: _LocationPin(
                      color: AppTheme.accentGold,
                      icon: Icons.store_rounded,
                    ),
                  ),
                  // Destination dot
                  Positioned(
                    bottom: 28,
                    right: 32,
                    child: _LocationPin(
                      color: const Color(0xFF12B76A),
                      icon: Icons.home_rounded,
                    ),
                  ),
                  // Moving truck
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.accentGold.withValues(alpha: 0.25),
                            blurRadius: 14,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.local_shipping_rounded,
                        size: 28,
                        color: AppTheme.accentGold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // ── Label area ──
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.qr_code_rounded,
                    size: 20,
                    color: AppTheme.accentGold,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationPin extends StatelessWidget {
  final Color color;
  final IconData icon;

  const _LocationPin({required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.15),
        border: Border.all(color: color, width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 8,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Icon(icon, size: 16, color: color),
    );
  }
}

/// Paints a subtle curved dashed route between origin and destination.
class _RoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.accentGold.withValues(alpha: 0.25)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path()
      ..moveTo(50, 46)
      ..cubicTo(
        size.width * 0.3,
        size.height * 0.8,
        size.width * 0.7,
        size.height * 0.2,
        size.width - 50,
        size.height - 46,
      );

    // Draw dashed
    const dashWidth = 6.0;
    const dashSpace = 4.0;
    final metric = path.computeMetrics().first;
    double distance = 0;
    while (distance < metric.length) {
      final end = (distance + dashWidth).clamp(0, metric.length);
      canvas.drawPath(metric.extractPath(distance, end.toDouble()), paint);
      distance += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
