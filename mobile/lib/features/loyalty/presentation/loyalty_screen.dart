import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/currency_utils.dart';
import '../services/loyalty_service.dart';

class LoyaltyScreen extends ConsumerWidget {
  const LoyaltyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(loyaltyStatusProvider);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        backgroundColor: AppTheme.ivoryBackground,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          color: AppTheme.deepCharcoal,
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Khách hàng thân thiết',
          style: AppTextStyle.displaySm(color: AppTheme.deepCharcoal),
        ),
        centerTitle: true,
      ),
      body: statusAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 40, color: Colors.red),
              const SizedBox(height: 12),
              Text('Không thể tải dữ liệu', style: AppTextStyle.bodyMd()),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => ref.refresh(loyaltyStatusProvider),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
        data: (status) => _LoyaltyBody(
          status: status,
          onRefresh: () => ref.refresh(loyaltyStatusProvider),
        ),
      ),
    );
  }
}

class _LoyaltyBody extends StatelessWidget {
  final LoyaltyStatus status;
  final VoidCallback onRefresh;

  const _LoyaltyBody({required this.status, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          _PointsHeroCard(status: status),
          const SizedBox(height: 16),
          _TiersCard(status: status),
          const SizedBox(height: 16),
          _HowItWorksCard(),
          const SizedBox(height: 16),
          _TransactionHistory(history: status.history),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Hero points card
// ──────────────────────────────────────────────

class _PointsHeroCard extends StatelessWidget {
  final LoyaltyStatus status;

  const _PointsHeroCard({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.deepCharcoal,
            AppTheme.deepCharcoal.withValues(alpha: 0.85),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepCharcoal.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppTheme.accentGold.withValues(alpha: 0.4),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.star_rounded,
                      size: 12,
                      color: AppTheme.accentGold,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      status.tierName.toUpperCase(),
                      style: GoogleFonts.montserrat(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.accentGold,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Icon(
                Icons.auto_awesome_rounded,
                size: 18,
                color: AppTheme.accentGold.withValues(alpha: 0.6),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            '${status.points}',
            style: GoogleFonts.playfairDisplay(
              fontSize: 52,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              height: 1.0,
            ),
          ),
          Text(
            'ĐIỂM TÍCH LŨY',
            style: GoogleFonts.montserrat(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Colors.white.withValues(alpha: 0.5),
              letterSpacing: 2.0,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.account_balance_wallet_outlined,
                  size: 14,
                  color: AppTheme.accentGold,
                ),
                const SizedBox(width: 6),
                Text(
                  'Tương đương ${formatVND(status.totalValueVnd.toDouble())}',
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
          if (status.points < 5000) ...[
            const SizedBox(height: 20),
            // Progress to next tier
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${status.points} / ${status.nextTierPoints} điểm',
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
                Text(
                  '${status.nextTierPoints - status.points} điểm lên hạng tiếp',
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.accentGold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: status.tierProgress,
                backgroundColor: Colors.white.withValues(alpha: 0.12),
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.accentGold),
                minHeight: 5,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Tier milestones
// ──────────────────────────────────────────────

class _TiersCard extends StatelessWidget {
  final LoyaltyStatus status;

  const _TiersCard({required this.status});

  @override
  Widget build(BuildContext context) {
    final tiers = [
      _TierInfo('Bronze', 0, Icons.shield_outlined, const Color(0xFFCD7F32)),
      _TierInfo('Silver', 500, Icons.shield_outlined, const Color(0xFFA8A9AD)),
      _TierInfo(
        'Gold',
        2000,
        Icons.workspace_premium_outlined,
        AppTheme.accentGold,
      ),
      _TierInfo(
        'Platinum',
        5000,
        Icons.diamond_outlined,
        const Color(0xFF90CAF9),
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.softTaupe),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Cấp hạng thành viên',
            style: AppTextStyle.titleMd(color: AppTheme.deepCharcoal),
          ),
          const SizedBox(height: 16),
          Row(
            children: tiers.map((tier) {
              final isActive = status.tierName == tier.name;
              final isUnlocked = status.points >= tier.minPoints;
              return Expanded(
                child: Column(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isActive
                            ? tier.color.withValues(alpha: 0.15)
                            : isUnlocked
                            ? tier.color.withValues(alpha: 0.08)
                            : AppTheme.softTaupe.withValues(alpha: 0.4),
                        border: Border.all(
                          color: isActive ? tier.color : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: Icon(
                        tier.icon,
                        size: 20,
                        color: isUnlocked
                            ? tier.color
                            : AppTheme.mutedSilver.withValues(alpha: 0.5),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      tier.name,
                      style: GoogleFonts.montserrat(
                        fontSize: 9,
                        fontWeight: isActive
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isActive ? tier.color : AppTheme.mutedSilver,
                        letterSpacing: 0.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    Text(
                      tier.minPoints == 0
                          ? 'Mặc định'
                          : '${tier.minPoints} pts',
                      style: GoogleFonts.montserrat(
                        fontSize: 8,
                        fontWeight: FontWeight.w400,
                        color: AppTheme.mutedSilver.withValues(alpha: 0.7),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _TierInfo {
  final String name;
  final int minPoints;
  final IconData icon;
  final Color color;

  const _TierInfo(this.name, this.minPoints, this.icon, this.color);
}

// ──────────────────────────────────────────────
// How it works card
// ──────────────────────────────────────────────

class _HowItWorksCard extends StatelessWidget {
  const _HowItWorksCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.accentGold.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline_rounded,
                size: 16,
                color: AppTheme.accentGold,
              ),
              const SizedBox(width: 8),
              Text(
                'Cách tích điểm',
                style: AppTextStyle.titleMd(color: AppTheme.deepCharcoal),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _infoRow(
            Icons.shopping_bag_outlined,
            'Mua hàng',
            'Cứ 10.000đ = 1 điểm tích lũy',
          ),
          const SizedBox(height: 10),
          _infoRow(
            Icons.account_balance_wallet_outlined,
            'Đổi điểm',
            '1 điểm = 500đ giảm giá khi thanh toán',
          ),
          const SizedBox(height: 10),
          _infoRow(
            Icons.star_outline_rounded,
            'Lên hạng',
            'Tích đủ điểm để nhận ưu đãi đặc biệt theo cấp hạng',
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: AppTheme.accentGold.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 14, color: AppTheme.accentGold),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                desc,
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  fontWeight: FontWeight.w400,
                  color: AppTheme.mutedSilver,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// Transaction history
// ──────────────────────────────────────────────

class _TransactionHistory extends StatelessWidget {
  final List<LoyaltyTransaction> history;

  const _TransactionHistory({required this.history});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.softTaupe),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
            child: Row(
              children: [
                Icon(
                  Icons.history_rounded,
                  size: 16,
                  color: AppTheme.accentGold,
                ),
                const SizedBox(width: 8),
                Text(
                  'Lịch sử giao dịch',
                  style: AppTextStyle.titleMd(color: AppTheme.deepCharcoal),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF0EDE8)),
          if (history.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.receipt_long_outlined,
                      size: 36,
                      color: AppTheme.mutedSilver.withValues(alpha: 0.4),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Chưa có giao dịch nào',
                      style: AppTextStyle.bodyMd(color: AppTheme.mutedSilver),
                    ),
                  ],
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: history.length,
              separatorBuilder: (_, __) => const Divider(
                height: 1,
                color: Color(0xFFF0EDE8),
                indent: 60,
              ),
              itemBuilder: (_, i) => _TransactionTile(tx: history[i]),
            ),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final LoyaltyTransaction tx;

  const _TransactionTile({required this.tx});

  @override
  Widget build(BuildContext context) {
    final isEarn = tx.points > 0;
    final color = isEarn ? const Color(0xFF4CAF50) : const Color(0xFFE57373);
    final bgColor = isEarn
        ? const Color(0xFF4CAF50).withValues(alpha: 0.08)
        : const Color(0xFFE57373).withValues(alpha: 0.08);

    final readableReason = tx.reason
        .replaceAll('_', ' ')
        .replaceAll('EARNED FROM ORDER', 'Tích điểm đơn hàng')
        .replaceAll('REDEEMED FOR DISCOUNT', 'Đổi điểm giảm giá');

    final day = tx.createdAt.day.toString().padLeft(2, '0');
    final month = tx.createdAt.month.toString().padLeft(2, '0');
    final dateStr = '$day/$month/${tx.createdAt.year}';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(shape: BoxShape.circle, color: bgColor),
            child: Icon(
              isEarn ? Icons.add_rounded : Icons.remove_rounded,
              size: 18,
              color: color,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  readableReason,
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.deepCharcoal,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  dateStr,
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${isEarn ? '+' : ''}${tx.points}',
            style: GoogleFonts.playfairDisplay(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
