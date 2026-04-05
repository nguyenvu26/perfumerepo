import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../providers/order_provider.dart';
import '../../providers/order_realtime_provider.dart';
import '../widgets/order_timeline.dart';
import '../widgets/tracking_map_card.dart';

class TrackOrderScreen extends ConsumerWidget {
  final String orderId;

  const TrackOrderScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<OrderStatusEvent?>(orderRealtimeProvider, (prev, next) {
      if (next != null && next.orderId == orderId) {
        ref.invalidate(orderDetailProvider(orderId));
        ref.invalidate(trackingProvider(orderId));
      }
    });

    final trackingAsync = ref.watch(trackingProvider(orderId));

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: trackingAsync.when(
        data: (tracking) => RefreshIndicator(
          color: AppTheme.accentGold,
          onRefresh: () async {
            ref.invalidate(orderDetailProvider(orderId));
            ref.invalidate(trackingProvider(orderId));
          },
          child: CustomScrollView(
            slivers: [
              // ── Gradient AppBar ──
              SliverAppBar(
                expandedHeight: 130,
                pinned: true,
                backgroundColor: AppTheme.ivoryBackground,
                surfaceTintColor: Colors.transparent,
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 16,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFFF8F2EB), Color(0xFFEDE3D8)],
                      ),
                    ),
                    child: SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(56, 16, 20, 0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tracking.header,
                              style: GoogleFonts.playfairDisplay(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.deepCharcoal,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.accentGold.withValues(
                                  alpha: 0.12,
                                ),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.schedule_rounded,
                                    size: 14,
                                    color: AppTheme.accentGold,
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    tracking.etaText,
                                    style: GoogleFonts.montserrat(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.accentGold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // ── Body content ──
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Map card
                    TrackingMapCard(label: tracking.mapLabel),
                    const SizedBox(height: 20),

                    // Timeline section header
                    Padding(
                      padding: const EdgeInsets.only(left: 4, bottom: 14),
                      child: Row(
                        children: [
                          Container(
                            width: 3,
                            height: 18,
                            decoration: BoxDecoration(
                              color: AppTheme.accentGold,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Lộ trình đơn hàng',
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.deepCharcoal,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Timeline card
                    Container(
                      padding: const EdgeInsets.fromLTRB(14, 18, 14, 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.deepCharcoal.withValues(
                              alpha: 0.05,
                            ),
                            blurRadius: 14,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: OrderTimeline(steps: tracking.steps),
                    ),
                  ]),
                ),
              ),
            ],
          ),
        ),
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.accentGold),
        ),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  size: 48,
                  color: AppTheme.mutedSilver,
                ),
                const SizedBox(height: 12),
                Text(
                  error.toString(),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
