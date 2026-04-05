import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../models/payment_method.dart';

class PaymentMethodTile extends StatelessWidget {
  final String title;
  final String description;
  final PaymentMethodType type;
  final bool isSelected;
  final String? badgeLabel;
  final VoidCallback onTap;

  const PaymentMethodTile({
    super.key,
    required this.title,
    required this.description,
    required this.type,
    required this.isSelected,
    required this.onTap,
    this.badgeLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFFDF6E9) // warm light gold
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? AppTheme.accentGold
                : AppTheme.softTaupe,
            width: isSelected ? 1.6 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.accentGold.withValues(alpha: 0.12),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: AppTheme.deepCharcoal.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            splashColor: AppTheme.accentGold.withValues(alpha: 0.08),
            highlightColor: AppTheme.accentGold.withValues(alpha: 0.05),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  // Left icon
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.accentGold.withValues(alpha: 0.14)
                          : AppTheme.ivoryBackground,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      _iconForType(type),
                      size: 22,
                      color: isSelected
                          ? AppTheme.accentGold
                          : AppTheme.mutedSilver,
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Middle content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                title,
                                style: GoogleFonts.montserrat(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.deepCharcoal,
                                  height: 1.3,
                                ),
                              ),
                            ),
                            if (badgeLabel != null) ...[
                              const SizedBox(width: 8),
                              _Badge(label: badgeLabel!),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          description,
                          style: GoogleFonts.montserrat(
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            color: AppTheme.mutedSilver,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Right check icon
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 180),
                    switchInCurve: Curves.easeOutBack,
                    switchOutCurve: Curves.easeIn,
                    transitionBuilder: (child, animation) {
                      return ScaleTransition(
                        scale: animation,
                        child: child,
                      );
                    },
                    child: isSelected
                        ? Container(
                            key: const ValueKey('check'),
                            width: 28,
                            height: 28,
                            decoration: const BoxDecoration(
                              color: AppTheme.accentGold,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.check_rounded,
                              size: 16,
                              color: Colors.white,
                            ),
                          )
                        : Container(
                            key: const ValueKey('empty'),
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppTheme.softTaupe,
                                width: 1.8,
                              ),
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  static IconData _iconForType(PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.payos:
        return Icons.qr_code_2_rounded;
      case PaymentMethodType.cod:
        return Icons.local_shipping_outlined;
      case PaymentMethodType.vnpay:
        return Icons.account_balance_wallet_outlined;
      case PaymentMethodType.momo:
        return Icons.account_balance_wallet_outlined;
    }
  }
}

class _Badge extends StatelessWidget {
  final String label;

  const _Badge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF7E8CD), Color(0xFFEDD9B3)],
        ),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: GoogleFonts.montserrat(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.4,
          color: const Color(0xFF9B7B3A),
        ),
      ),
    );
  }
}
