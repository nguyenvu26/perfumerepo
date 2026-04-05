import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../models/address.dart';
import '../../providers/address_providers.dart';
import '../widgets/address_card.dart';
import 'address_form_screen.dart';

class AddressManagementScreen extends ConsumerStatefulWidget {
  const AddressManagementScreen({super.key});

  @override
  ConsumerState<AddressManagementScreen> createState() =>
      _AddressManagementScreenState();
}

class _AddressManagementScreenState
    extends ConsumerState<AddressManagementScreen> {
  @override
  void initState() {
    super.initState();
    // Re-fetch on each screen open so users always see latest addresses.
    Future.microtask(() => ref.read(addressListProvider.notifier).reload());
  }

  @override
  Widget build(BuildContext context) {
    final addressesAsync = ref.watch(addressListProvider);
    final selectedAddress = ref.watch(selectedAddressProvider);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 18,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Sổ địa chỉ',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: addressesAsync.when(
        loading: () => const _AddressLoadingSkeleton(),
        error: (error, _) => _AddressErrorState(
          message: error.toString(),
          onRetry: () => ref.read(addressListProvider.notifier).reload(),
        ),
        data: (addresses) {
          final defaultAddress = addresses.cast<Address?>().firstWhere(
            (item) => item?.isDefault == true,
            orElse: () => null,
          );

          if (addresses.isEmpty) {
            return const _AddressEmptyState();
          }

          final nonDefault = addresses
              .where((item) => !item.isDefault)
              .toList();

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
            children: [
              if (defaultAddress != null) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    'Địa chỉ mặc định',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                ),
                AddressCard(
                  address: defaultAddress,
                  selected: selectedAddress?.id == defaultAddress.id,
                  onSelect: () => ref
                      .read(addressListProvider.notifier)
                      .selectAddress(defaultAddress),
                  onSetDefault: null,
                  onEdit: () =>
                      _openForm(context, initialAddress: defaultAddress),
                  onDelete: () => _confirmDelete(context, ref, defaultAddress),
                ),
                const SizedBox(height: 18),
              ],
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      'Địa chỉ đã lưu',
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                  ),
              const SizedBox(height: 8),
              ...nonDefault.map((address) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AddressCard(
                    address: address,
                    selected: selectedAddress?.id == address.id,
                    onSelect: () => ref
                        .read(addressListProvider.notifier)
                        .selectAddress(address),
                    onSetDefault: () => _setDefault(context, ref, address.id),
                    onEdit: () => _openForm(context, initialAddress: address),
                    onDelete: () => _confirmDelete(context, ref, address),
                  ),
                );
              }),
            ],
          );
        },
      ),
    ),
  ],
),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: FilledButton.icon(
            onPressed: () => _openForm(context),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.deepCharcoal,
              minimumSize: const Size.fromHeight(56),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
            ),
            icon: const Icon(Icons.add, size: 20),
            label: Text(
              'Thêm địa chỉ mới',
              style: GoogleFonts.montserrat(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openForm(
    BuildContext context, {
    Address? initialAddress,
  }) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => AddressFormScreen(initialAddress: initialAddress),
      ),
    );
  }

  Future<void> _setDefault(
    BuildContext context,
    WidgetRef ref,
    String id,
  ) async {
    try {
      await ref.read(addressListProvider.notifier).setDefaultAddress(id);
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString()), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    Address address,
  ) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Xóa địa chỉ'),
          content: Text(
            'Bạn có chắc muốn xóa địa chỉ ${address.label.displayName}?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Hủy'),
            ),
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Xóa'),
            ),
          ],
        );
      },
    );

    if (ok != true) return;

    try {
      await ref.read(addressListProvider.notifier).deleteAddress(address.id);
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString()), backgroundColor: Colors.red),
      );
    }
  }
}

class _AddressLoadingSkeleton extends StatelessWidget {
  const _AddressLoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      itemCount: 4,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: 128,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppTheme.softTaupe.withValues(alpha: 0.8),
            ),
          ),
        );
      },
    );
  }
}

class _AddressErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _AddressErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 40),
            const SizedBox(height: 10),
            Text(
              message,
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Thử lại')),
          ],
        ),
      ),
    );
  }
}

class _AddressEmptyState extends StatelessWidget {
  const _AddressEmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.location_on_outlined, size: 44),
            const SizedBox(height: 12),
            Text(
              'Bạn chưa có địa chỉ giao hàng nào',
              style: GoogleFonts.montserrat(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Thêm địa chỉ để checkout có thể tạo đơn và tạo vận đơn GHN tự động.',
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppTheme.mutedSilver,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
