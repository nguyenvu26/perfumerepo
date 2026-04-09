import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/luxury_button.dart';

class ShippingAddressesScreen extends StatefulWidget {
  const ShippingAddressesScreen({super.key});

  @override
  State<ShippingAddressesScreen> createState() =>
      _ShippingAddressesScreenState();
}

class _ShippingAddressesScreenState extends State<ShippingAddressesScreen> {
  late List<_ShippingAddressItem> _addresses;

  static const List<_ShippingAddressItem> _seedAddresses = [
    _ShippingAddressItem(
      id: 'home',
      label: 'Nhà riêng',
      recipientName: 'Mia Tran',
      phoneNumber: '0909 245 118',
      addressLine: '12 Nguyen Hue, Ben Nghe Ward, District 1, Ho Chi Minh City',
      note: 'Giao giờ hành chính, gọi trước 10 phút.',
      isDefault: true,
      accentColor: Color(0xFFD4AF37),
    ),
    _ShippingAddressItem(
      id: 'office',
      label: 'Văn phòng',
      recipientName: 'Mia Tran',
      phoneNumber: '0918 200 456',
      addressLine:
          'Floor 8, 81 Le Duan, Ben Nghe Ward, District 1, Ho Chi Minh City',
      note: 'Nhận tại lễ tân, ghi chú tên công ty Solenne Studio.',
      accentColor: Color(0xFF7E8F7A),
    ),
    _ShippingAddressItem(
      id: 'gift',
      label: 'Quà tặng',
      recipientName: 'Linh Nguyen',
      phoneNumber: '0935 620 882',
      addressLine: '28 Tran Phu, Hai Chau District, Da Nang',
      note: 'Thêm thiệp chúc mừng và gói quà tối màu.',
      accentColor: Color(0xFFB9824A),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _addresses = _seedAddresses;
  }

  _ShippingAddressItem? get _defaultAddress {
    for (final address in _addresses) {
      if (address.isDefault) return address;
    }
    return null;
  }

  void _setDefaultAddress(String id) {
    setState(() {
      _addresses = _addresses
          .map((address) => address.copyWith(isDefault: address.id == id))
          .toList();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã cập nhật địa chỉ mặc định')),
    );
  }

  void _deleteAddress(String id) {
    final address = _addresses.firstWhere((item) => item.id == id);

    setState(() {
      _addresses = _addresses.where((item) => item.id != id).toList();
      if (address.isDefault && _addresses.isNotEmpty) {
        _addresses = [
          _addresses.first.copyWith(isDefault: true),
          ..._addresses.skip(1),
        ];
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Đã xóa địa chỉ ${address.label.toLowerCase()}')),
    );
  }

  Future<void> _showAddressForm({_ShippingAddressItem? initialAddress}) async {
    final result = await showModalBottomSheet<_ShippingAddressItem>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddressFormSheet(address: initialAddress),
    );

    if (result == null || !mounted) return;

    setState(() {
      if (initialAddress == null) {
        if (result.isDefault) {
          _addresses = _addresses
              .map((address) => address.copyWith(isDefault: false))
              .toList();
        }
        _addresses = [result, ..._addresses];
      } else {
        _addresses = _addresses.map((address) {
          if (result.isDefault && address.id != result.id) {
            return address.copyWith(isDefault: false);
          }
          return address.id == result.id ? result : address;
        }).toList();
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          initialAddress == null
              ? 'Đã thêm địa chỉ giao hàng mới'
              : 'Đã cập nhật địa chỉ giao hàng',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final defaultAddress = _defaultAddress;

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(
                            Icons.arrow_back,
                            color: AppTheme.deepCharcoal,
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              Text(
                                'ĐỊA CHỈ GIAO HÀNG',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.montserrat(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 2.1,
                                  color: AppTheme.mutedSilver,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Quản lý điểm nhận hàng',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.playfairDisplay(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.deepCharcoal,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 48),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Chọn địa chỉ mặc định cho các đơn hàng tiếp theo, đồng thời lưu riêng địa chỉ quà tặng hoặc văn phòng để thanh toán nhanh hơn.',
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        height: 1.6,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.deepCharcoal.withValues(alpha: 0.72),
                      ),
                    ),
                    const SizedBox(height: 18),
                    _AddressHeroCard(
                      totalCount: _addresses.length,
                      defaultLabel: defaultAddress?.label ?? 'Chưa thiết lập',
                      recipientName:
                          defaultAddress?.recipientName ??
                          'Chưa có địa chỉ mặc định',
                    ),
                    const SizedBox(height: 18),
                    const _SectionTitle(
                      eyebrow: 'ĐỊA CHỈ ĐÃ LƯU',
                      title: 'Sẵn sàng cho mọi kịch bản giao hàng',
                    ),
                    const SizedBox(height: 14),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
              sliver: SliverList.builder(
                itemCount: _addresses.length + 1,
                itemBuilder: (context, index) {
                  if (index == _addresses.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: _DeliveryTipsCard(defaultAddress: defaultAddress),
                    );
                  }

                  final address = _addresses[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _ShippingAddressCard(
                      address: address,
                      onMakeDefault: address.isDefault
                          ? null
                          : () => _setDefaultAddress(address.id),
                      onEdit: () => _showAddressForm(initialAddress: address),
                      onDelete: () => _deleteAddress(address.id),
                    ),
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
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 18),
          child: LuxuryButton(
            text: 'Thêm địa chỉ mới',
            leadingIcon: Icons.add_location_alt_outlined,
            onPressed: _showAddressForm,
          ),
        ),
      ),
    );
  }
}

class _AddressHeroCard extends StatelessWidget {
  final int totalCount;
  final String defaultLabel;
  final String recipientName;

  const _AddressHeroCard({
    required this.totalCount,
    required this.defaultLabel,
    required this.recipientName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF5E8D5), Color(0xFFE0C79E)],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepCharcoal.withValues(alpha: 0.08),
            blurRadius: 18,
            offset: const Offset(0, 10),
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
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.68),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '$totalCount địa chỉ đã lưu',
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
              ),
              const Spacer(),
              const Icon(
                Icons.local_shipping_outlined,
                color: AppTheme.deepCharcoal,
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            'Địa chỉ mặc định hiện tại là $defaultLabel.',
            style: GoogleFonts.playfairDisplay(
              fontSize: 28,
              height: 1.05,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Người nhận ưu tiên: $recipientName. Bạn có thể đổi nhanh địa chỉ nhận ngay trước khi thanh toán.',
            style: GoogleFonts.montserrat(
              fontSize: 12,
              height: 1.6,
              fontWeight: FontWeight.w500,
              color: AppTheme.deepCharcoal.withValues(alpha: 0.72),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String eyebrow;
  final String title;

  const _SectionTitle({required this.eyebrow, required this.title});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: GoogleFonts.montserrat(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.8,
            color: AppTheme.mutedSilver,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: GoogleFonts.playfairDisplay(
            fontSize: 22,
            fontWeight: FontWeight.w600,
            color: AppTheme.deepCharcoal,
          ),
        ),
      ],
    );
  }
}

class _ShippingAddressCard extends StatelessWidget {
  final _ShippingAddressItem address;
  final VoidCallback? onMakeDefault;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ShippingAddressCard({
    required this.address,
    required this.onMakeDefault,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: address.isDefault
              ? address.accentColor.withValues(alpha: 0.3)
              : AppTheme.softTaupe,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepCharcoal.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: address.accentColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  Icons.location_on_outlined,
                  color: address.accentColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          address.label,
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.deepCharcoal,
                          ),
                        ),
                        if (address.isDefault)
                          _StatusChip(
                            label: 'Mặc định',
                            color: address.accentColor,
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${address.recipientName} • ${address.phoneNumber}',
                      style: GoogleFonts.montserrat(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            address.addressLine,
            style: GoogleFonts.montserrat(
              fontSize: 12,
              height: 1.6,
              fontWeight: FontWeight.w500,
              color: AppTheme.deepCharcoal.withValues(alpha: 0.72),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.ivoryBackground,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.sticky_note_2_outlined,
                  size: 18,
                  color: address.accentColor,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    address.note,
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      height: 1.5,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (onMakeDefault != null)
                OutlinedButton.icon(
                  onPressed: onMakeDefault,
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: const Text('Đặt mặc định'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: address.accentColor,
                    side: BorderSide(color: address.accentColor),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
              TextButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Chỉnh sửa'),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.deepCharcoal,
                ),
              ),
              TextButton.icon(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Xóa'),
                style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: GoogleFonts.montserrat(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _DeliveryTipsCard extends StatelessWidget {
  final _ShippingAddressItem? defaultAddress;

  const _DeliveryTipsCard({required this.defaultAddress});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF1E7DA),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Gợi ý giao hàng mượt hơn',
            style: GoogleFonts.playfairDisplay(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            defaultAddress == null
                ? 'Hãy tạo địa chỉ đầu tiên để checkout có thể tự động điền thông tin nhận hàng.'
                : 'Địa chỉ mặc định hiện tại là ${defaultAddress!.label.toLowerCase()}. Nếu đây là địa chỉ công ty, hãy luôn điền người nhận và ghi chú quầy lễ tân để shipper giao thuận lợi hơn.',
            style: GoogleFonts.montserrat(
              fontSize: 12,
              height: 1.6,
              fontWeight: FontWeight.w500,
              color: AppTheme.deepCharcoal.withValues(alpha: 0.72),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddressFormSheet extends StatefulWidget {
  final _ShippingAddressItem? address;

  const _AddressFormSheet({this.address});

  @override
  State<_AddressFormSheet> createState() => _AddressFormSheetState();
}

class _AddressFormSheetState extends State<_AddressFormSheet> {
  late final TextEditingController _labelController;
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  late final TextEditingController _noteController;
  late bool _isDefault;

  @override
  void initState() {
    super.initState();
    final address = widget.address;
    _labelController = TextEditingController(text: address?.label ?? '');
    _nameController = TextEditingController(text: address?.recipientName ?? '');
    _phoneController = TextEditingController(text: address?.phoneNumber ?? '');
    _addressController = TextEditingController(
      text: address?.addressLine ?? '',
    );
    _noteController = TextEditingController(text: address?.note ?? '');
    _isDefault = address?.isDefault ?? false;
  }

  @override
  void dispose() {
    _labelController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _save() {
    final label = _labelController.text.trim();
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final addressLine = _addressController.text.trim();
    final note = _noteController.text.trim();

    if (label.isEmpty || name.isEmpty || phone.isEmpty || addressLine.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng điền đủ thông tin bắt buộc')),
      );
      return;
    }

    Navigator.of(context).pop(
      _ShippingAddressItem(
        id:
            widget.address?.id ??
            DateTime.now().millisecondsSinceEpoch.toString(),
        label: label,
        recipientName: name,
        phoneNumber: phone,
        addressLine: addressLine,
        note: note.isEmpty ? 'Không có ghi chú giao hàng.' : note,
        isDefault: _isDefault,
        accentColor: widget.address?.accentColor ?? const Color(0xFFD4AF37),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets;

    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        decoration: const BoxDecoration(
          color: AppTheme.creamWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.softTaupe,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  widget.address == null
                      ? 'Thêm địa chỉ giao hàng'
                      : 'Chỉnh sửa địa chỉ',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 26,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Lưu thông tin nhận hàng để checkout nhanh và chính xác hơn.',
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.mutedSilver,
                  ),
                ),
                const SizedBox(height: 18),
                _AddressField(
                  controller: _labelController,
                  label: 'Nhãn địa chỉ',
                  hint: 'Ví dụ: Nhà riêng, Văn phòng',
                ),
                const SizedBox(height: 12),
                _AddressField(
                  controller: _nameController,
                  label: 'Người nhận',
                  hint: 'Tên người nhận hàng',
                ),
                const SizedBox(height: 12),
                _AddressField(
                  controller: _phoneController,
                  label: 'Số điện thoại',
                  hint: '09xx xxx xxx',
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                _AddressField(
                  controller: _addressController,
                  label: 'Địa chỉ đầy đủ',
                  hint: 'Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành',
                  maxLines: 3,
                ),
                const SizedBox(height: 12),
                _AddressField(
                  controller: _noteController,
                  label: 'Ghi chú giao hàng',
                  hint: 'Ví dụ: Gọi trước khi giao, nhận ở lễ tân...',
                  maxLines: 2,
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Đặt làm địa chỉ mặc định',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  subtitle: Text(
                    'Địa chỉ này sẽ được ưu tiên điền sẵn ở bước thanh toán.',
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      height: 1.5,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                  trailing: Switch.adaptive(
                    value: _isDefault,
                    activeThumbColor: AppTheme.accentGold,
                    onChanged: (value) => setState(() => _isDefault = value),
                  ),
                  onTap: () => setState(() => _isDefault = !_isDefault),
                ),
                const SizedBox(height: 12),
                LuxuryButton(
                  text: widget.address == null
                      ? 'Lưu địa chỉ'
                      : 'Cập nhật địa chỉ',
                  onPressed: _save,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AddressField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final TextInputType? keyboardType;
  final int maxLines;

  const _AddressField({
    required this.controller,
    required this.label,
    required this.hint,
    this.keyboardType,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.montserrat(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.1,
            color: AppTheme.mutedSilver,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: GoogleFonts.montserrat(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppTheme.deepCharcoal,
          ),
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: BorderSide(
                color: AppTheme.softTaupe.withValues(alpha: 0.8),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: BorderSide(
                color: AppTheme.softTaupe.withValues(alpha: 0.8),
              ),
            ),
            focusedBorder: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(18)),
              borderSide: BorderSide(color: AppTheme.accentGold),
            ),
          ),
        ),
      ],
    );
  }
}

class _ShippingAddressItem {
  final String id;
  final String label;
  final String recipientName;
  final String phoneNumber;
  final String addressLine;
  final String note;
  final bool isDefault;
  final Color accentColor;

  const _ShippingAddressItem({
    required this.id,
    required this.label,
    required this.recipientName,
    required this.phoneNumber,
    required this.addressLine,
    required this.note,
    this.isDefault = false,
    required this.accentColor,
  });

  _ShippingAddressItem copyWith({bool? isDefault}) {
    return _ShippingAddressItem(
      id: id,
      label: label,
      recipientName: recipientName,
      phoneNumber: phoneNumber,
      addressLine: addressLine,
      note: note,
      isDefault: isDefault ?? this.isDefault,
      accentColor: accentColor,
    );
  }
}
