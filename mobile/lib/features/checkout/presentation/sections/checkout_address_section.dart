import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../address/models/address.dart';
import '../../../address/providers/address_providers.dart';
import '../../providers/checkout_provider.dart';

class CheckoutAddressSection extends StatelessWidget {
  final Address? address;
  final VoidCallback onTap;
  final bool highlight;

  const CheckoutAddressSection({
    super.key,
    required this.address,
    required this.onTap,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    final selectedAddress = address;
    final isEmpty = selectedAddress == null;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: highlight && isEmpty
                  ? Colors.orange.withValues(alpha: 0.6)
                  : AppTheme.softTaupe,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.ivoryBackground,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.location_on_outlined,
                  color: isEmpty ? AppTheme.mutedSilver : AppTheme.deepCharcoal,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            selectedAddress?.recipientName ??
                                'Thêm địa chỉ giao hàng',
                            style: GoogleFonts.montserrat(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: isEmpty
                                  ? (highlight
                                        ? Colors.orange.shade700
                                        : AppTheme.mutedSilver)
                                  : AppTheme.deepCharcoal,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (selectedAddress?.isDefault ?? false) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.accentGold.withValues(
                                alpha: 0.12,
                              ),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              'Mặc định',
                              style: GoogleFonts.montserrat(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.accentGold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (!isEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        selectedAddress.fullAddress,
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          height: 1.5,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.mutedSilver,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.chevron_right_rounded,
                color: isEmpty ? AppTheme.accentGold : AppTheme.mutedSilver,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Bottom-sheet picker for selecting a shipping address.
class AddressPickerSheet extends ConsumerWidget {
  final VoidCallback onSelected;

  const AddressPickerSheet({super.key, required this.onSelected});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesAsync = ref.watch(addressListProvider);
    final selected = ref.watch(selectedAddressProvider);

    return CheckoutSheet(
      title: 'Chọn địa chỉ giao hàng',
      subtitle: 'Danh sách này được đồng bộ trực tiếp từ tài khoản của bạn.',
      child: addressesAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.symmetric(vertical: 18),
          child: Center(
            child: CircularProgressIndicator(color: AppTheme.accentGold),
          ),
        ),
        error: (error, _) => Column(
          children: [
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => ref.read(addressListProvider.notifier).reload(),
              child: const Text('Thử lại'),
            ),
          ],
        ),
        data: (addresses) {
          if (addresses.isEmpty) {
            return Column(
              children: [
                Text(
                  'Bạn chưa có địa chỉ. Hãy thêm địa chỉ trước khi đặt hàng.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.mutedSilver,
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: () => context.push(AppRoutes.shippingAddresses),
                  child: const Text('Mở màn quản lý địa chỉ'),
                ),
              ],
            );
          }

          return Column(
            children: [
              ...addresses.map((address) {
                return SelectableTile(
                  title: address.recipientName,
                  subtitle: address.fullAddress,
                  badge: address.isDefault ? 'Mặc định' : null,
                  icon: Icons.location_on_outlined,
                  isSelected: selected?.id == address.id,
                  onTap: () async {
                    await ref
                        .read(checkoutProvider.notifier)
                        .selectAddress(address);
                    onSelected();
                  },
                );
              }),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => context.push(AppRoutes.shippingAddresses),
                  icon: const Icon(Icons.add),
                  label: const Text('Quản lý địa chỉ'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Reusable bottom sheet container for checkout flows.
class CheckoutSheet extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;

  const CheckoutSheet({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
      decoration: const BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.softTaupe,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              style: GoogleFonts.playfairDisplay(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                height: 1.5,
                fontWeight: FontWeight.w500,
                color: AppTheme.mutedSilver,
              ),
            ),
            const SizedBox(height: 18),
            child,
          ],
        ),
      ),
    );
  }
}

/// Reusable selectable row tile for bottom sheets.
class SelectableTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? badge;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const SelectableTile({
    super.key,
    required this.title,
    required this.subtitle,
    this.badge,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: isSelected ? const Color(0xFFF3ECE1) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? AppTheme.accentGold : AppTheme.softTaupe,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: AppTheme.ivoryBackground,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: AppTheme.deepCharcoal),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              title,
                              style: GoogleFonts.montserrat(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.deepCharcoal,
                              ),
                            ),
                          ),
                          if (badge != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.8),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                badge!,
                                style: GoogleFonts.montserrat(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.accentGold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        subtitle,
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          height: 1.5,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.mutedSilver,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Icon(
                  isSelected
                      ? Icons.radio_button_checked
                      : Icons.radio_button_off,
                  color: isSelected
                      ? AppTheme.accentGold
                      : AppTheme.mutedSilver,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
