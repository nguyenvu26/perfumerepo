import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../providers/order_provider.dart';

class OrderTimeline extends StatelessWidget {
  final List<TrackingTimelineStep> steps;

  const OrderTimeline({super.key, required this.steps});

  static const _icons = <IconData>[
    Icons.receipt_long_rounded,
    Icons.verified_rounded,
    Icons.inventory_2_rounded,
    Icons.local_shipping_rounded,
    Icons.check_circle_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: steps.asMap().entries.map((entry) {
        final index = entry.key;
        final step = entry.value;
        final isLast = index == steps.length - 1;
        final icon = index < _icons.length ? _icons[index] : Icons.circle;

        return _TimelineRow(step: step, icon: icon, isLast: isLast);
      }).toList(),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  final TrackingTimelineStep step;
  final IconData icon;
  final bool isLast;

  const _TimelineRow({
    required this.step,
    required this.icon,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final Color activeColor = step.current
        ? AppTheme.accentGold
        : const Color(0xFF12B76A);
    final Color inactiveColor = AppTheme.softTaupe;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Left: icon + connector line ──
          SizedBox(
            width: 44,
            child: Column(
              children: [
                // Icon circle
                AnimatedContainer(
                  duration: const Duration(milliseconds: 350),
                  curve: Curves.easeOutCubic,
                  width: step.current ? 40 : 36,
                  height: step.current ? 40 : 36,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: step.reached
                        ? (step.current
                              ? AppTheme.accentGold.withValues(alpha: 0.15)
                              : const Color(0xFF12B76A).withValues(alpha: 0.12))
                        : Colors.white,
                    border: Border.all(
                      color: step.reached ? activeColor : inactiveColor,
                      width: step.current ? 2.2 : 1.5,
                    ),
                    boxShadow: step.current
                        ? [
                            BoxShadow(
                              color: AppTheme.accentGold.withValues(
                                alpha: 0.25,
                              ),
                              blurRadius: 10,
                              spreadRadius: 1,
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    icon,
                    size: step.current ? 19 : 16,
                    color: step.reached ? activeColor : inactiveColor,
                  ),
                ),
                // Connector line
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 2),
                      decoration: BoxDecoration(
                        gradient: step.reached
                            ? LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  activeColor.withValues(alpha: 0.5),
                                  activeColor.withValues(alpha: 0.15),
                                ],
                              )
                            : null,
                        color: step.reached
                            ? null
                            : inactiveColor.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(1),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          // ── Right: title + description + time ──
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(
                    step.title,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: step.current ? 16 : 14,
                      fontWeight: step.current
                          ? FontWeight.w700
                          : FontWeight.w600,
                      color: step.reached
                          ? AppTheme.deepCharcoal
                          : AppTheme.mutedSilver,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    step.description,
                    style: GoogleFonts.montserrat(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w400,
                      height: 1.5,
                      color: step.reached
                          ? const Color(0xFF6B6B6B)
                          : AppTheme.mutedSilver.withValues(alpha: 0.7),
                    ),
                  ),
                  if (step.timestamp != null) ...[
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time_rounded,
                          size: 12,
                          color: step.current
                              ? AppTheme.accentGold
                              : AppTheme.mutedSilver,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatTime(step.timestamp!),
                          style: GoogleFonts.montserrat(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                            color: step.current
                                ? AppTheme.accentGold
                                : AppTheme.mutedSilver,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _formatTime(DateTime value) {
  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '$day/$month $hour:$minute';
}
