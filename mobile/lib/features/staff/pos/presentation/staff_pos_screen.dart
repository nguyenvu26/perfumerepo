import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../models/pos_models.dart';
import '../providers/pos_provider.dart';
import 'pos_barcode_sheet.dart';

bool _looksLikeBarcodeInput(String raw) {
  final t = raw.trim();
  if (t.length < 4) return false;
  if (RegExp(r'\s').hasMatch(t)) return false;
  if (RegExp(r'^\d{4,24}$').hasMatch(t)) return true;
  if (RegExp(r'^[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]$').hasMatch(t) &&
      t.length <= 48) {
    return true;
  }
  return false;
}

class StaffPosScreen extends ConsumerStatefulWidget {
  const StaffPosScreen({super.key});

  @override
  ConsumerState<StaffPosScreen> createState() => _StaffPosScreenState();
}

class _StaffPosScreenState extends ConsumerState<StaffPosScreen> {
  final _searchController = TextEditingController();
  final _phoneController = TextEditingController();
  final _currencyFmt = NumberFormat('#,###', 'vi_VN');

  @override
  void dispose() {
    _searchController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final stores = ref.watch(posStoresProvider);
    final selectedStoreId = ref.watch(posSelectedStoreIdProvider);
    final posState = ref.watch(posProvider);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: stores.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        error: (e, _) => _buildErrorView(e.toString()),
        data: (storeList) {
          if (storeList.isEmpty) {
            return _buildEmptyStores();
          }
          return Column(
            children: [
              _buildHeader(storeList, selectedStoreId),
              Expanded(
                child: selectedStoreId == null
                    ? _buildPickStoreHint()
                    : posState.currentOrder != null &&
                          posState.currentOrder!.isPaid
                    ? _buildPaidView(posState.currentOrder!)
                    : _buildActiveContent(selectedStoreId, posState),
              ),
            ],
          );
        },
      ),
    );
  }

  // ── Header ─────────────────────────────────────────────────────

  Widget _buildHeader(List storeList, String? selectedStoreId) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        MediaQuery.of(context).padding.top + AppSpacing.xs,
        AppSpacing.md,
        AppSpacing.xs,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2C2C2C), Color(0xFF1A1A1A)],
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              ref.read(posProvider.notifier).clearOrder();
              ref.read(posSelectedStoreIdProvider.notifier).state = null;
              _searchController.clear();
              ref.read(posSearchQueryProvider.notifier).state = '';
            },
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.accentGold,
                        AppTheme.accentGold.withValues(alpha: 0.7),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(
                    Icons.point_of_sale_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
                AppSpacing.horzSm,
                Text(
                  'POS',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          AppSpacing.horzMd,
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: AppRadius.inputBorder,
                border: Border.all(color: Colors.white24),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: selectedStoreId,
                  isExpanded: true,
                  dropdownColor: const Color(0xFF2C2C2C),
                  hint: Text(
                    'Chọn quầy',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      color: Colors.white54,
                    ),
                  ),
                  icon: const Icon(
                    Icons.expand_more_rounded,
                    size: 20,
                    color: AppTheme.accentGold,
                  ),
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    color: Colors.white,
                  ),
                  items: storeList.map<DropdownMenuItem<String>>((s) {
                    return DropdownMenuItem<String>(
                      value: s.id as String,
                      child: Text('${s.name}'),
                    );
                  }).toList(),
                  onChanged: (v) {
                    ref.read(posSelectedStoreIdProvider.notifier).state = v;
                    ref.read(posProvider.notifier).clearOrder();
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Empty / Hint states ────────────────────────────────────────

  Widget _buildEmptyStores() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.store_mall_directory_outlined,
            size: 56,
            color: AppTheme.mutedSilver,
          ),
          AppSpacing.vertMd,
          Text(
            'Bạn chưa được gán vào quầy nào',
            style: GoogleFonts.montserrat(
              fontSize: 14,
              color: AppTheme.mutedSilver,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPickStoreHint() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.touch_app_rounded, size: 56, color: AppTheme.mutedSilver),
          AppSpacing.vertMd,
          Text(
            'Chọn quầy để bắt đầu bán hàng',
            style: GoogleFonts.montserrat(
              fontSize: 14,
              color: AppTheme.mutedSilver,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(String error) {
    return Center(
      child: Padding(
        padding: AppSpacing.screenAll,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: Colors.red.shade300,
            ),
            AppSpacing.vertMd,
            Text(
              error,
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(
                fontSize: 13,
                color: Colors.red.shade400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Start Order (removed — now goes directly to product browsing) ──

  // ── Main Active Content (local cart OR edit-existing-order) ─────

  Widget _buildActiveContent(String storeId, PosState posState) {
    // Listen for success / error
    ref.listen<PosState>(posProvider, (prev, next) {
      if (next.successMessage != null && prev?.successMessage == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.successMessage!),
            backgroundColor: Colors.green.shade600,
          ),
        );
      }
      if (next.error != null && prev?.error == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: Colors.red.shade600,
          ),
        );
      }
    });

    final isEdit = posState.isEditMode;
    final order = posState.currentOrder;

    return Column(
      children: [
        // Order info bar (only in edit mode)
        if (isEdit && order != null) _buildOrderInfoBar(order),
        // Attached customer hint (new-order mode)
        if (!isEdit && posState.customerPhone != null)
          _buildCustomerHintBar(posState.customerPhone!),
        // Search bar
        _buildSearchBar(storeId),
        // Products
        Expanded(
          child: isEdit
              ? _buildProductGrid(order!, posState)
              : _buildProductGridLocal(storeId, posState),
        ),
        // Cart footer
        if (isEdit && order != null && order.items.isNotEmpty)
          _buildCartFooterEdit(order, posState),
        if (!isEdit && posState.localCart.isNotEmpty)
          _buildCartFooterLocal(storeId, posState),
      ],
    );
  }

  Widget _buildCustomerHintBar(String phone) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      color: AppTheme.accentGold.withValues(alpha: 0.08),
      child: Row(
        children: [
          const Icon(
            Icons.person_rounded,
            size: 16,
            color: AppTheme.accentGold,
          ),
          const SizedBox(width: 6),
          Text(
            'Khách: $phone',
            style: GoogleFonts.montserrat(
              fontSize: 12,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const Spacer(),
          InkWell(
            onTap: () => _showLocalCustomerSheet(),
            child: Text(
              'Đổi',
              style: GoogleFonts.montserrat(
                fontSize: 11,
                color: AppTheme.accentGold,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          InkWell(
            onTap: () => ref.read(posProvider.notifier).setCustomerPhone(''),
            child: const Icon(
              Icons.close_rounded,
              size: 16,
              color: AppTheme.mutedSilver,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderInfoBar(PosOrder order) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      color: order.isPaid
          ? Colors.green.shade50
          : AppTheme.accentGold.withValues(alpha: 0.08),
      child: Row(
        children: [
          Icon(
            order.isPaid ? Icons.check_circle_rounded : Icons.receipt_rounded,
            size: 18,
            color: order.isPaid ? Colors.green : AppTheme.accentGold,
          ),
          const SizedBox(width: 8),
          Text(
            order.code,
            style: GoogleFonts.montserrat(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const Spacer(),
          if (order.user != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.creamWhite,
                borderRadius: AppRadius.chipBorder,
                border: Border.all(color: AppTheme.softTaupe),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.person_rounded,
                    size: 14,
                    color: AppTheme.accentGold,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    order.user!.fullName ?? order.phone ?? '',
                    style: GoogleFonts.montserrat(fontSize: 11),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${order.user!.loyaltyPoints} pts',
                    style: GoogleFonts.montserrat(
                      fontSize: 10,
                      color: AppTheme.accentGold,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          if (!order.isPaid && order.user == null)
            _buildAttachCustomerButton(order),
        ],
      ),
    );
  }

  Widget _buildAttachCustomerButton(PosOrder order) {
    return InkWell(
      onTap: () => _showCustomerSheet(order),
      borderRadius: AppRadius.chipBorder,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.softTaupe),
          borderRadius: AppRadius.chipBorder,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.person_add_alt_1_rounded,
              size: 14,
              color: AppTheme.mutedSilver,
            ),
            const SizedBox(width: 4),
            Text(
              'Gắn KH',
              style: GoogleFonts.montserrat(
                fontSize: 11,
                color: AppTheme.mutedSilver,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Paid success view ──────────────────────────────────────────

  Widget _buildPaidView(PosOrder order) {
    return Center(
      child: Padding(
        padding: AppSpacing.screenAll,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.check_circle_rounded,
              size: 72,
              color: Colors.green.shade400,
            ),
            AppSpacing.vertMd,
            Text(
              'Thanh toán thành công!',
              style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppTheme.deepCharcoal,
              ),
            ),
            AppSpacing.vertXs,
            Text(
              '${_currencyFmt.format(order.finalAmount)}đ',
              style: GoogleFonts.montserrat(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.accentGold,
              ),
            ),
            AppSpacing.vertXs,
            Text(
              order.code,
              style: GoogleFonts.montserrat(
                fontSize: 13,
                color: AppTheme.mutedSilver,
              ),
            ),
            AppSpacing.vertXl,
            ElevatedButton.icon(
              onPressed: () {
                ref.read(posProvider.notifier).clearOrder();
              },
              icon: const Icon(Icons.add_rounded),
              label: const Text('Tạo đơn mới'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentGold,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: AppRadius.buttonBorder,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Active order: product search + cart (EDIT mode) ──────────────

  // (Search bar is shared; product grid for edit mode already exists)

  Widget _buildSearchBar(String storeId) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.sm,
        AppSpacing.md,
        AppSpacing.xs,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              onChanged: (v) {
                ref.read(posSearchQueryProvider.notifier).state = v;
                setState(() {});
              },
              textInputAction: TextInputAction.search,
              onSubmitted: (v) async {
                if (!_looksLikeBarcodeInput(v)) return;
                final ok = await ref
                    .read(posProvider.notifier)
                    .applyBarcode(v, storeId);
                if (!mounted) return;
                if (ok) {
                  _searchController.clear();
                  ref.read(posSearchQueryProvider.notifier).state = '';
                }
              },
              decoration: InputDecoration(
                hintText: 'Tìm sản phẩm, SKU, mã vạch…',
                hintStyle: GoogleFonts.montserrat(
                  fontSize: 13,
                  color: AppTheme.mutedSilver,
                ),
                prefixIcon: const Icon(
                  Icons.search_rounded,
                  color: AppTheme.mutedSilver,
                  size: 20,
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(posSearchQueryProvider.notifier).state = '';
                          setState(() {});
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                filled: true,
                fillColor: AppTheme.creamWhite,
                border: OutlineInputBorder(
                  borderRadius: AppRadius.inputBorder,
                  borderSide: BorderSide(color: AppTheme.softTaupe),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: AppRadius.inputBorder,
                  borderSide: BorderSide(color: AppTheme.softTaupe),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: AppRadius.inputBorder,
                  borderSide: const BorderSide(color: AppTheme.accentGold),
                ),
              ),
              style: GoogleFonts.montserrat(fontSize: 13),
            ),
          ),
          const SizedBox(width: 6),
          Material(
            color: AppTheme.creamWhite,
            borderRadius: AppRadius.inputBorder,
            child: InkWell(
              onTap: () async {
                final code = await showPosBarcodeSheet(context);
                if (!mounted || code == null || code.isEmpty) return;
                final ok =
                    await ref.read(posProvider.notifier).applyBarcode(
                          code,
                          storeId,
                        );
                if (!mounted) return;
                if (ok) {
                  _searchController.clear();
                  ref.read(posSearchQueryProvider.notifier).state = '';
                }
              },
              borderRadius: AppRadius.inputBorder,
              child: Container(
                height: 48,
                width: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  borderRadius: AppRadius.inputBorder,
                  border: Border.all(color: AppTheme.softTaupe),
                ),
                child: const Icon(
                  Icons.qr_code_scanner_rounded,
                  color: AppTheme.accentGold,
                  size: 22,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductGrid(PosOrder order, PosState posState) {
    final products = ref.watch(posProductsProvider);

    return products.when(
      loading: () => ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: 4,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: ShimmerCard(height: 80),
        ),
      ),
      error: (e, _) => Center(
        child: Text(
          'Lỗi: $e',
          style: GoogleFonts.montserrat(
            fontSize: 13,
            color: Colors.red.shade400,
          ),
        ),
      ),
      data: (productList) {
        if (productList.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.inventory_2_outlined,
                  size: 48,
                  color: AppTheme.mutedSilver.withValues(alpha: 0.5),
                ),
                AppSpacing.vertSm,
                Text(
                  'Không tìm thấy sản phẩm',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.xs,
            AppSpacing.md,
            AppSpacing.md,
          ),
          itemCount: productList.length,
          itemBuilder: (ctx, i) =>
              _buildProductCard(productList[i], order, posState),
        );
      },
    );
  }

  Widget _buildProductCard(
    PosProduct product,
    PosOrder order,
    PosState posState,
  ) {
    final imageUrl = product.images.isNotEmpty
        ? product.images.first.url
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: AppRadius.cardBorder,
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product header
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.sm,
              AppSpacing.sm,
              AppSpacing.sm,
              0,
            ),
            child: Row(
              children: [
                // Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                  child: imageUrl != null
                      ? Image.network(
                          imageUrl,
                          width: 32,
                          height: 32,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              _buildPlaceholderImage(),
                        )
                      : _buildPlaceholderImage(),
                ),
                AppSpacing.horzSm,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (product.brand != null)
                        Text(
                          product.brand!.name.toUpperCase(),
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.accentGold,
                            letterSpacing: 1,
                          ),
                        ),
                      Text(
                        product.name,
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Variants
          Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: product.variants.map((v) {
                final inCart = order.items.any((it) => it.variantId == v.id);
                return _buildVariantChip(v, inCart, order, posState);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.softTaupe.withValues(alpha: 0.3),
            AppTheme.softTaupe.withValues(alpha: 0.15),
          ],
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        Icons.local_mall_outlined,
        size: 22,
        color: AppTheme.mutedSilver.withValues(alpha: 0.6),
      ),
    );
  }

  Widget _buildVariantChip(
    PosVariant variant,
    bool inCart,
    PosOrder order,
    PosState posState,
  ) {
    return InkWell(
      onTap: posState.isLoading
          ? null
          : () {
              if (inCart) {
                final item = order.items.firstWhere(
                  (it) => it.variantId == variant.id,
                );
                _showItemQuantitySheet(variant, item);
              } else {
                ref.read(posProvider.notifier).addItem(variant.id, 1);
              }
            },
      borderRadius: AppRadius.chipBorder,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: inCart
              ? AppTheme.accentGold.withValues(alpha: 0.12)
              : AppTheme.ivoryBackground,
          borderRadius: AppRadius.chipBorder,
          border: Border.all(
            color: inCart ? AppTheme.accentGold : AppTheme.softTaupe,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              variant.name,
              style: GoogleFonts.montserrat(
                fontSize: 11,
                fontWeight: inCart ? FontWeight.w600 : FontWeight.w500,
                color: inCart ? AppTheme.accentGold : AppTheme.deepCharcoal,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '${_currencyFmt.format(variant.price)}đ',
              style: GoogleFonts.montserrat(
                fontSize: 10,
                color: AppTheme.mutedSilver,
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: variant.stock > 5
                    ? Colors.green.shade50
                    : variant.stock > 0
                    ? Colors.orange.shade50
                    : Colors.red.shade50,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'SL: ${variant.stock}',
                style: GoogleFonts.montserrat(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: variant.stock > 5
                      ? Colors.green.shade700
                      : variant.stock > 0
                      ? Colors.orange.shade700
                      : Colors.red.shade700,
                ),
              ),
            ),
            if (inCart) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${order.items.firstWhere((it) => it.variantId == variant.id).quantity}',
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── Local Cart: Product Grid ─────────────────────────────────────

  Widget _buildProductGridLocal(String storeId, PosState posState) {
    final products = ref.watch(posProductsProvider);

    return products.when(
      loading: () => ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: 4,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: ShimmerCard(height: 80),
        ),
      ),
      error: (e, _) => Center(
        child: Text(
          'Lỗi: $e',
          style: GoogleFonts.montserrat(
            fontSize: 13,
            color: Colors.red.shade400,
          ),
        ),
      ),
      data: (productList) {
        if (productList.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.inventory_2_outlined,
                  size: 48,
                  color: AppTheme.mutedSilver.withValues(alpha: 0.5),
                ),
                AppSpacing.vertSm,
                Text(
                  'Không tìm thấy sản phẩm',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.xs,
            AppSpacing.md,
            AppSpacing.md,
          ),
          itemCount: productList.length,
          itemBuilder: (ctx, i) =>
              _buildProductCardLocal(productList[i], posState),
        );
      },
    );
  }

  Widget _buildProductCardLocal(PosProduct product, PosState posState) {
    final imageUrl = product.images.isNotEmpty
        ? product.images.first.url
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: AppRadius.cardBorder,
        border: Border.all(color: AppTheme.softTaupe.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.sm,
              AppSpacing.sm,
              AppSpacing.sm,
              0,
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                  child: imageUrl != null
                      ? Image.network(
                          imageUrl,
                          width: 32,
                          height: 32,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              _buildPlaceholderImage(),
                        )
                      : _buildPlaceholderImage(),
                ),
                AppSpacing.horzSm,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (product.brand != null)
                        Text(
                          product.brand!.name.toUpperCase(),
                          style: GoogleFonts.montserrat(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.accentGold,
                            letterSpacing: 1,
                          ),
                        ),
                      Text(
                        product.name,
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: product.variants.map((v) {
                final cartItem = posState.localCart
                    .cast<LocalCartItem?>()
                    .firstWhere(
                      (c) => c!.variantId == v.id,
                      orElse: () => null,
                    );
                final inCart = cartItem != null;
                return _buildVariantChipLocal(
                  v,
                  product.name,
                  inCart,
                  cartItem,
                  posState,
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVariantChipLocal(
    PosVariant variant,
    String productName,
    bool inCart,
    LocalCartItem? cartItem,
    PosState posState,
  ) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Main chip — tap to add (new) or open qty sheet (existing)
        GestureDetector(
          onTap: posState.isLoading
              ? null
              : () {
                  if (inCart) {
                    _showLocalItemQuantitySheet(variant, cartItem!);
                  } else {
                    HapticFeedback.lightImpact();
                    ref
                        .read(posProvider.notifier)
                        .addToCart(variant, productName);
                  }
                },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            decoration: BoxDecoration(
              color: inCart
                  ? AppTheme.accentGold.withValues(alpha: 0.12)
                  : AppTheme.ivoryBackground,
              borderRadius: AppRadius.chipBorder,
              border: Border.all(
                color: inCart ? AppTheme.accentGold : AppTheme.softTaupe,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  variant.name,
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    fontWeight: inCart ? FontWeight.w600 : FontWeight.w500,
                    color: inCart ? AppTheme.accentGold : AppTheme.deepCharcoal,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '${_currencyFmt.format(variant.price)}đ',
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    color: AppTheme.mutedSilver,
                  ),
                ),
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: variant.stock > 5
                        ? Colors.green.shade50
                        : variant.stock > 0
                        ? Colors.orange.shade50
                        : Colors.red.shade50,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '${variant.stock}',
                    style: GoogleFonts.montserrat(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: variant.stock > 5
                          ? Colors.green.shade700
                          : variant.stock > 0
                          ? Colors.orange.shade700
                          : Colors.red.shade700,
                    ),
                  ),
                ),
                if (inCart && cartItem != null) ...[
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 5,
                      vertical: 1,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${cartItem.quantity}',
                      style: GoogleFonts.montserrat(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        // Quick-add (+) button — always adds 1
        if (variant.stock > 0 && !posState.isLoading)
          Padding(
            padding: const EdgeInsets.only(left: 3),
            child: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                ref.read(posProvider.notifier).addToCart(variant, productName);
              },
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppTheme.accentGold.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.add_rounded,
                  size: 15,
                  color: AppTheme.accentGold,
                ),
              ),
            ),
          ),
      ],
    );
  }

  // ── Cart Footer (LOCAL cart — new order mode) ──────────────────

  Widget _buildCartFooterLocal(String storeId, PosState posState) {
    final cart = posState.localCart;
    final total = posState.localCartTotal;
    final totalQty = cart.fold<int>(0, (sum, c) => sum + c.quantity);

    return Container(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.sm,
        AppSpacing.md,
        AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF2C2C2C), Color(0xFF1A1A1A)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Cart summary row
          InkWell(
            onTap: () => _showLocalCartDetailSheet(posState),
            child: Row(
              children: [
                Icon(
                  Icons.shopping_cart_rounded,
                  size: 20,
                  color: AppTheme.accentGold,
                ),
                const SizedBox(width: 8),
                Text(
                  '${cart.length} SP · $totalQty chai',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    color: Colors.white70,
                  ),
                ),
                const Spacer(),
                // Attach customer button
                if (posState.customerPhone == null ||
                    posState.customerPhone!.isEmpty)
                  InkWell(
                    onTap: () => _showLocalCustomerSheet(),
                    borderRadius: AppRadius.chipBorder,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.softTaupe),
                        borderRadius: AppRadius.chipBorder,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.person_add_alt_1_rounded,
                            size: 14,
                            color: Colors.white54,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Gắn KH',
                            style: GoogleFonts.montserrat(
                              fontSize: 11,
                              color: Colors.white54,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(width: 8),
                Text(
                  '${_currencyFmt.format(total)}đ',
                  style: GoogleFonts.montserrat(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.accentGold,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.expand_less_rounded,
                  size: 20,
                  color: Colors.white54,
                ),
              ],
            ),
          ),
          AppSpacing.vertXs,
          // Payment buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: posState.isLoading || cart.isEmpty
                      ? null
                      : () {
                          HapticFeedback.mediumImpact();
                          ref.read(posProvider.notifier).checkoutCash(storeId);
                        },
                  icon: posState.isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.payments_rounded, size: 18),
                  label: const Text('Tiền mặt'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.buttonBorder,
                    ),
                  ),
                ),
              ),
              AppSpacing.horzSm,
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: posState.isLoading || cart.isEmpty
                      ? null
                      : () => _handleLocalQrPayment(storeId),
                  icon: const Icon(Icons.qr_code_rounded, size: 18),
                  label: const Text('QR Code'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.accentGold,
                    side: const BorderSide(color: AppTheme.accentGold),
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.buttonBorder,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Cart Footer (EDIT mode — existing server-side order) ───────

  Widget _buildCartFooterEdit(PosOrder order, PosState posState) {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.sm,
        AppSpacing.md,
        AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF2C2C2C), Color(0xFF1A1A1A)],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Cart items summary
          InkWell(
            onTap: () => _showCartDetailSheet(order),
            child: Row(
              children: [
                Icon(
                  Icons.shopping_cart_rounded,
                  size: 20,
                  color: AppTheme.accentGold,
                ),
                const SizedBox(width: 8),
                Text(
                  '${order.items.length} sản phẩm',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    color: Colors.white70,
                  ),
                ),
                const Spacer(),
                Text(
                  '${_currencyFmt.format(order.finalAmount)}đ',
                  style: GoogleFonts.montserrat(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.accentGold,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.expand_less_rounded,
                  size: 20,
                  color: Colors.white54,
                ),
              ],
            ),
          ),
          AppSpacing.vertXs,
          // Pay buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: posState.isLoading || order.items.isEmpty
                      ? null
                      : () => ref.read(posProvider.notifier).payCash(),
                  icon: posState.isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.payments_rounded, size: 18),
                  label: const Text('Tiền mặt'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.buttonBorder,
                    ),
                  ),
                ),
              ),
              AppSpacing.horzSm,
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: posState.isLoading || order.items.isEmpty
                      ? null
                      : () => _handleQrPayment(order),
                  icon: const Icon(Icons.qr_code_rounded, size: 18),
                  label: const Text('QR Code'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.accentGold,
                    side: const BorderSide(color: AppTheme.accentGold),
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.buttonBorder,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Bottom Sheets ──────────────────────────────────────────────

  void _showCustomerSheet(PosOrder order) {
    _phoneController.text = order.phone ?? '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.lg,
            AppSpacing.md,
            MediaQuery.of(ctx).viewInsets.bottom + AppSpacing.md,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Gắn khách hàng',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              AppSpacing.vertMd,
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Số điện thoại',
                  hintText: '0901234567',
                  prefixIcon: const Icon(Icons.phone_rounded),
                  border: OutlineInputBorder(
                    borderRadius: AppRadius.inputBorder,
                  ),
                ),
                style: GoogleFonts.montserrat(fontSize: 14),
              ),
              AppSpacing.vertMd,
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final phone = _phoneController.text.trim();
                    if (phone.isNotEmpty) {
                      ref.read(posProvider.notifier).setCustomer(phone);
                      Navigator.pop(ctx);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.buttonBorder,
                    ),
                  ),
                  child: const Text('Xác nhận'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showItemQuantitySheet(PosVariant variant, PosOrderItem item) {
    int qty = item.quantity;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    variant.name,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  Text(
                    '${_currencyFmt.format(variant.price)}đ / đơn vị',
                    style: GoogleFonts.montserrat(
                      fontSize: 12,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                  AppSpacing.vertLg,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _circleButton(
                        Icons.remove_rounded,
                        onTap: qty > 0
                            ? () => setSheetState(() => qty--)
                            : null,
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.lg,
                        ),
                        child: Text(
                          '$qty',
                          style: GoogleFonts.montserrat(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.deepCharcoal,
                          ),
                        ),
                      ),
                      _circleButton(
                        Icons.add_rounded,
                        onTap: qty < variant.stock
                            ? () => setSheetState(() => qty++)
                            : null,
                      ),
                    ],
                  ),
                  Text(
                    'Tồn kho: ${variant.stock}',
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                  AppSpacing.vertLg,
                  Row(
                    children: [
                      if (qty == 0)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              ref
                                  .read(posProvider.notifier)
                                  .removeItem(variant.id);
                              Navigator.pop(ctx);
                            },
                            icon: const Icon(
                              Icons.delete_outline_rounded,
                              size: 18,
                            ),
                            label: const Text('Xóa'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: BorderSide(color: Colors.red.shade300),
                              padding: const EdgeInsets.symmetric(
                                vertical: AppSpacing.sm,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: AppRadius.buttonBorder,
                              ),
                            ),
                          ),
                        ),
                      if (qty == 0) AppSpacing.horzSm,
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            if (qty == 0) {
                              ref
                                  .read(posProvider.notifier)
                                  .removeItem(variant.id);
                            } else {
                              ref
                                  .read(posProvider.notifier)
                                  .updateItemQuantity(variant.id, qty);
                            }
                            Navigator.pop(ctx);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.accentGold,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              vertical: AppSpacing.sm,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: AppRadius.buttonBorder,
                            ),
                          ),
                          child: Text(qty == 0 ? 'Xóa khỏi đơn' : 'Cập nhật'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showCartDetailSheet(PosOrder order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.5,
          maxChildSize: 0.85,
          minChildSize: 0.3,
          expand: false,
          builder: (ctx, scrollCtrl) {
            return Column(
              children: [
                // Handle
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sm),
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.softTaupe,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    children: [
                      Text(
                        'Giỏ hàng',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${order.items.length} sản phẩm',
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          color: AppTheme.mutedSilver,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.separated(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                    ),
                    itemCount: order.items.length,
                    separatorBuilder: (_, __) => Divider(
                      color: AppTheme.softTaupe.withValues(alpha: 0.5),
                    ),
                    itemBuilder: (ctx, i) => _buildCartItem(order.items[i]),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tổng cộng',
                        style: GoogleFonts.montserrat(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                      Text(
                        '${_currencyFmt.format(order.finalAmount)}đ',
                        style: GoogleFonts.montserrat(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.accentGold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildCartItem(PosOrderItem item) {
    final productName = item.variant?.product?.name ?? 'Sản phẩm';
    final variantName = item.variant?.name ?? '';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  productName,
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '$variantName  x${item.quantity}',
                  style: GoogleFonts.montserrat(
                    fontSize: 11,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${_currencyFmt.format(item.totalPrice)}đ',
            style: GoogleFonts.montserrat(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
          ),
        ],
      ),
    );
  }

  // ── QR Payment ─────────────────────────────────────────────────

  Future<void> _handleQrPayment(PosOrder order) async {
    final service = ref.read(staffPosServiceProvider);
    try {
      final result = await service.payQr(order.id);
      final checkoutUrl = result['checkoutUrl'] as String?;
      if (checkoutUrl != null && mounted) {
        _showQrLinkDialog(checkoutUrl);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tạo QR: $e'),
            backgroundColor: Colors.red.shade600,
          ),
        );
      }
    }
  }

  void _showQrLinkDialog(String url) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: AppRadius.cardBorder),
        title: Text(
          'Thanh toán QR',
          style: GoogleFonts.playfairDisplay(
            fontWeight: FontWeight.w700,
            color: AppTheme.deepCharcoal,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.qr_code_2_rounded,
              size: 64,
              color: AppTheme.accentGold,
            ),
            AppSpacing.vertMd,
            Text(
              'Gửi link thanh toán cho khách hàng hoặc mở trên thiết bị khác:',
              style: GoogleFonts.montserrat(
                fontSize: 12,
                color: AppTheme.mutedSilver,
              ),
              textAlign: TextAlign.center,
            ),
            AppSpacing.vertSm,
            SelectableText(
              url,
              style: GoogleFonts.montserrat(
                fontSize: 11,
                color: AppTheme.accentGold,
                decoration: TextDecoration.underline,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  // ── Local Cart: Bottom Sheets ────────────────────────────────────

  void _showLocalCustomerSheet() {
    _phoneController.text = ref.read(posProvider).customerPhone ?? '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.lg,
            AppSpacing.md,
            MediaQuery.of(ctx).viewInsets.bottom + AppSpacing.md,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Gắn khách hàng',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              AppSpacing.vertMd,
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Số điện thoại',
                  hintText: '0901234567',
                  prefixIcon: const Icon(Icons.phone_rounded),
                  border: OutlineInputBorder(
                    borderRadius: AppRadius.inputBorder,
                  ),
                ),
                style: GoogleFonts.montserrat(fontSize: 14),
              ),
              AppSpacing.vertMd,
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final phone = _phoneController.text.trim();
                    if (phone.isNotEmpty) {
                      ref.read(posProvider.notifier).setCustomerPhone(phone);
                      Navigator.pop(ctx);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.buttonBorder,
                    ),
                  ),
                  child: const Text('Xác nhận'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showLocalItemQuantitySheet(PosVariant variant, LocalCartItem cartItem) {
    int qty = cartItem.quantity;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    variant.name,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  Text(
                    '${_currencyFmt.format(variant.price)}đ / đơn vị',
                    style: GoogleFonts.montserrat(
                      fontSize: 12,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                  AppSpacing.vertLg,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _circleButton(
                        Icons.remove_rounded,
                        onTap: qty > 0
                            ? () => setSheetState(() => qty--)
                            : null,
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.lg,
                        ),
                        child: Text(
                          '$qty',
                          style: GoogleFonts.montserrat(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.deepCharcoal,
                          ),
                        ),
                      ),
                      _circleButton(
                        Icons.add_rounded,
                        onTap: qty < variant.stock
                            ? () => setSheetState(() => qty++)
                            : null,
                      ),
                    ],
                  ),
                  Text(
                    'Tồn kho: ${variant.stock}',
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                  AppSpacing.vertLg,
                  Row(
                    children: [
                      if (qty == 0)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              ref
                                  .read(posProvider.notifier)
                                  .removeFromCart(variant.id);
                              Navigator.pop(ctx);
                            },
                            icon: const Icon(
                              Icons.delete_outline_rounded,
                              size: 18,
                            ),
                            label: const Text('Xóa'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: BorderSide(color: Colors.red.shade300),
                              padding: const EdgeInsets.symmetric(
                                vertical: AppSpacing.sm,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: AppRadius.buttonBorder,
                              ),
                            ),
                          ),
                        ),
                      if (qty == 0) AppSpacing.horzSm,
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            ref
                                .read(posProvider.notifier)
                                .updateCartQuantity(variant.id, qty);
                            Navigator.pop(ctx);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.accentGold,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              vertical: AppSpacing.sm,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: AppRadius.buttonBorder,
                            ),
                          ),
                          child: Text(qty == 0 ? 'Xóa khỏi đơn' : 'Cập nhật'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showLocalCartDetailSheet(PosState posState) {
    final cart = posState.localCart;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.5,
          maxChildSize: 0.85,
          minChildSize: 0.3,
          expand: false,
          builder: (ctx, scrollCtrl) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sm),
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.softTaupe,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    children: [
                      Text(
                        'Giỏ hàng',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${cart.length} sản phẩm',
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          color: AppTheme.mutedSilver,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.separated(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                    ),
                    itemCount: cart.length,
                    separatorBuilder: (_, __) => Divider(
                      color: AppTheme.softTaupe.withValues(alpha: 0.5),
                    ),
                    itemBuilder: (ctx, i) {
                      final item = cart[i];
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: AppSpacing.xs,
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.productName,
                                    style: GoogleFonts.montserrat(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.deepCharcoal,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    '${item.variantName}  x${item.quantity}',
                                    style: GoogleFonts.montserrat(
                                      fontSize: 11,
                                      color: AppTheme.mutedSilver,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              '${_currencyFmt.format(item.totalPrice)}đ',
                              style: GoogleFonts.montserrat(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.deepCharcoal,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tổng cộng',
                        style: GoogleFonts.montserrat(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                      Text(
                        '${_currencyFmt.format(posState.localCartTotal)}đ',
                        style: GoogleFonts.montserrat(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.accentGold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _handleLocalQrPayment(String storeId) async {
    final result = await ref.read(posProvider.notifier).checkoutQr(storeId);
    if (result != null && mounted) {
      final checkoutUrl = result['checkoutUrl'] as String?;
      if (checkoutUrl != null) {
        _showQrLinkDialog(checkoutUrl);
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────

  Widget _circleButton(IconData icon, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: onTap != null
              ? AppTheme.accentGold.withValues(alpha: 0.12)
              : AppTheme.softTaupe.withValues(alpha: 0.3),
          shape: BoxShape.circle,
          border: Border.all(
            color: onTap != null ? AppTheme.accentGold : AppTheme.softTaupe,
          ),
        ),
        child: Icon(
          icon,
          color: onTap != null ? AppTheme.accentGold : AppTheme.mutedSilver,
          size: 24,
        ),
      ),
    );
  }
}
