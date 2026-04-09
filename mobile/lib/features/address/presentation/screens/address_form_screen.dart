import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_input.dart';
import '../../../../core/widgets/bottom_sheet_picker.dart';
import '../../models/address.dart';
import '../../models/address_form_state.dart';
import '../../providers/address_providers.dart';

class AddressFormScreen extends ConsumerWidget {
  final Address? initialAddress;

  const AddressFormScreen({super.key, this.initialAddress});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(addressFormProvider(initialAddress));
    final notifier = ref.read(addressFormProvider(initialAddress).notifier);

    Future<void> onSubmit() async {
      final ok = await notifier.submit();
      if (!context.mounted) return;

      if (!ok) {
        final message = ref
            .read(addressFormProvider(initialAddress))
            .errorMessage;
        if (message != null && message.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message), backgroundColor: Colors.red),
          );
        }
        return;
      }

      Navigator.of(context).pop(true);
    }

    Future<void> pickProvince() async {
      final selected = await showBottomSheetPicker<int>(
        context: context,
        title: 'Chọn Tỉnh / Thành phố',
        items: state.provinces
            .map((item) => PickerItem(value: item.id, label: item.name))
            .toList(),
        selected: state.provinceId,
      );
      if (selected != null) {
        await notifier.loadDistricts(selected);
      }
    }

    Future<void> pickDistrict() async {
      if (state.provinceId == null) return;
      final selected = await showBottomSheetPicker<int>(
        context: context,
        title: 'Chọn Quận / Huyện',
        items: state.districts
            .map((item) => PickerItem(value: item.id, label: item.name))
            .toList(),
        selected: state.districtId,
      );
      if (selected != null) {
        await notifier.loadWards(selected);
        await notifier.loadServices(selected);
      }
    }

    Future<void> pickWard() async {
      if (state.districtId == null) return;
      final selected = await showBottomSheetPicker<String>(
        context: context,
        title: 'Chọn Phường / Xã',
        items: state.wards
            .map((item) => PickerItem(value: item.code, label: item.name))
            .toList(),
        selected: state.wardCode,
      );
      if (selected != null) {
        notifier.setWardCode(selected);
      }
    }

    Future<void> pickService() async {
      if (state.services.isEmpty) return;
      final selected = await showBottomSheetPicker<int>(
        context: context,
        title: 'Chọn dịch vụ vận chuyển',
        items: state.services
            .map((item) => PickerItem(value: item.id, label: item.name))
            .toList(),
        selected: state.serviceId,
      );
      if (selected != null) {
        notifier.setServiceId(selected);
      }
    }

    final provinceName = _nameOfProvince(state);
    final districtName = _nameOfDistrict(state);
    final wardName = _nameOfWard(state);
    final serviceName = _nameOfService(state);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        backgroundColor: AppTheme.ivoryBackground,
        elevation: 0,
        centerTitle: false,
        titleSpacing: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(
            Icons.arrow_back,
            color: AppTheme.deepCharcoal,
            size: 24,
          ),
        ),
        title: Text(
          state.isEditing ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới',
          style: GoogleFonts.montserrat(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.deepCharcoal,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 120),
        children: [
          _SectionTitle(title: 'Thông tin người nhận'),
          const SizedBox(height: 10),
          _LabelSelector(selected: state.label, onChanged: notifier.setLabel),
          const SizedBox(height: 12),
          AppInput(
            label: 'Họ và tên',
            initialValue: state.recipientName,
            errorText: state.errorOf('recipientName'),
            onChanged: notifier.setRecipientName,
          ),
          const SizedBox(height: 12),
          AppInput(
            label: 'Số điện thoại',
            initialValue: state.phone,
            errorText: state.errorOf('phone'),
            keyboardType: TextInputType.phone,
            onChanged: notifier.setPhone,
          ),

          const SizedBox(height: 20),
          _SectionTitle(title: 'Địa chỉ giao hàng'),
          const SizedBox(height: 10),
          AppInput(
            label: 'Tỉnh / Thành phố',
            initialValue: provinceName,
            errorText: state.errorOf('provinceId'),
            readOnly: true,
            onTap: pickProvince,
            onChanged: (_) {},
            suffixIcon: state.loadingProvinces
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : const Icon(Icons.expand_more_rounded),
          ),
          const SizedBox(height: 12),
          AppInput(
            label: 'Quận / Huyện',
            initialValue: districtName,
            errorText: state.errorOf('districtId'),
            readOnly: true,
            enabled: state.provinceId != null,
            onTap: pickDistrict,
            onChanged: (_) {},
            suffixIcon: state.loadingDistricts
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : const Icon(Icons.expand_more_rounded),
          ),
          const SizedBox(height: 12),
          AppInput(
            label: 'Phường / Xã',
            initialValue: wardName,
            errorText: state.errorOf('wardCode'),
            readOnly: true,
            enabled: state.districtId != null,
            onTap: pickWard,
            onChanged: (_) {},
            suffixIcon: state.loadingWards
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : const Icon(Icons.expand_more_rounded),
          ),
          const SizedBox(height: 12),
          AppInput(
            label: 'Số nhà, tên đường',
            initialValue: state.detailAddress,
            errorText: state.errorOf('detailAddress'),
            maxLines: 2,
            onChanged: notifier.setDetailAddress,
          ),

          const SizedBox(height: 20),
          _SectionTitle(title: 'Thông tin bổ sung'),
          const SizedBox(height: 10),
          AppInput(
            label: 'Dịch vụ vận chuyển (tùy chọn)',
            initialValue: serviceName,
            readOnly: true,
            enabled: state.districtId != null,
            onTap: pickService,
            onChanged: (_) {},
            suffixIcon: state.loadingServices
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : const Icon(Icons.expand_more_rounded),
          ),
          const SizedBox(height: 12),
          AppInput(
            label: 'Ghi chú (tùy chọn)',
            initialValue: state.note,
            maxLines: 2,
            textInputAction: TextInputAction.done,
            onChanged: notifier.setNote,
          ),
          const SizedBox(height: 8),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: Text(
              'Đặt làm địa chỉ mặc định',
              style: GoogleFonts.montserrat(fontWeight: FontWeight.w600),
            ),
            value: state.isDefault,
            onChanged: notifier.setDefaultAddress,
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: FilledButton(
            onPressed: state.canSubmit && !state.isSubmitting ? onSubmit : null,
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.deepCharcoal,
              disabledBackgroundColor: AppTheme.softTaupe,
              disabledForegroundColor: AppTheme.mutedSilver,
              minimumSize: const Size.fromHeight(56),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
            ),
            child: state.isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(
                    state.isEditing ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ',
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

  String _nameOfProvince(AddressFormState state) {
    final id = state.provinceId;
    if (id == null) return '';
    for (final item in state.provinces) {
      if (item.id == id) return item.name;
    }
    return '';
  }

  String _nameOfDistrict(AddressFormState state) {
    final id = state.districtId;
    if (id == null) return '';
    for (final item in state.districts) {
      if (item.id == id) return item.name;
    }
    return '';
  }

  String _nameOfWard(AddressFormState state) {
    final code = state.wardCode;
    if (code == null) return '';
    for (final item in state.wards) {
      if (item.code == code) return item.name;
    }
    return '';
  }

  String _nameOfService(AddressFormState state) {
    final id = state.serviceId;
    if (id == null) return '';
    for (final item in state.services) {
      if (item.id == id) return item.name;
    }
    return '';
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.montserrat(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppTheme.deepCharcoal,
      ),
    );
  }
}

class _LabelSelector extends StatelessWidget {
  final AddressLabel selected;
  final ValueChanged<AddressLabel> onChanged;

  const _LabelSelector({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: AddressLabel.values.map((label) {
          final active = selected == label;
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: InkWell(
              onTap: () => onChanged(label),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: active
                      ? AppTheme.accentGold.withValues(alpha: 0.1)
                      : Colors.white,
                  border: Border.all(
                    color: active ? AppTheme.accentGold : AppTheme.softTaupe,
                    width: 1,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (active) ...[
                      const Icon(Icons.check, size: 16, color: AppTheme.accentGold),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      label.displayName,
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: active ? AppTheme.deepCharcoal : AppTheme.mutedSilver,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
