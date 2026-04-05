import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/luxury_button.dart';

class ProfilePaymentMethodsScreen extends StatefulWidget {
  const ProfilePaymentMethodsScreen({super.key});

  @override
  State<ProfilePaymentMethodsScreen> createState() =>
      _ProfilePaymentMethodsScreenState();
}

class _ProfilePaymentMethodsScreenState
    extends State<ProfilePaymentMethodsScreen> {
  late List<_SavedPaymentMethod> _methods;

  static const List<_SavedPaymentMethod> _seedMethods = [
    _SavedPaymentMethod(
      id: 'payos-online',
      type: _ManagedPaymentType.payos,
      title: 'Thanh toán online qua PayOS',
      subtitle: 'Mở cổng thanh toán bảo mật để quét QR hoặc chuyển khoản nhanh',
      statusLabel: 'Đang bật',
      details: 'Nhận biên nhận điện tử ngay sau khi hoàn tất thanh toán.',
      isDefault: true,
      isEnabled: true,
      accentColor: Color(0xFFD4AF37),
    ),
    _SavedPaymentMethod(
      id: 'cod',
      type: _ManagedPaymentType.cod,
      title: 'Thanh toán khi nhận hàng',
      subtitle:
          'Kiểm tra gói hàng rồi thanh toán trực tiếp cho đơn vị giao hàng',
      statusLabel: 'Dự phòng',
      details: 'Phù hợp khi bạn muốn giữ thanh toán đến lúc hàng giao tận nơi.',
      isDefault: false,
      isEnabled: true,
      accentColor: Color(0xFF7E8F7A),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _methods = _seedMethods;
  }

  _SavedPaymentMethod? get _defaultMethod {
    for (final method in _methods) {
      if (method.isDefault) return method;
    }
    return null;
  }

  void _setDefault(String id) {
    setState(() {
      _methods = _methods
          .map((method) => method.copyWith(isDefault: method.id == id))
          .toList();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đã cập nhật phương thức thanh toán ưu tiên'),
      ),
    );
  }

  void _toggleEnabled(String id, bool value) {
    setState(() {
      _methods = _methods.map((method) {
        if (method.id != id) return method;
        return method.copyWith(isEnabled: value);
      }).toList();
    });
  }

  Future<void> _editMethod(_SavedPaymentMethod method) async {
    final updatedMethod = await showModalBottomSheet<_SavedPaymentMethod>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _PaymentMethodSheet(method: method),
    );

    if (updatedMethod == null || !mounted) return;

    setState(() {
      _methods = _methods.map((existingMethod) {
        if (updatedMethod.isDefault && existingMethod.id != updatedMethod.id) {
          return existingMethod.copyWith(isDefault: false);
        }
        return existingMethod.id == updatedMethod.id
            ? updatedMethod
            : existingMethod;
      }).toList();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã cập nhật ${updatedMethod.title.toLowerCase()}'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final defaultMethod = _defaultMethod;

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
                                'PHƯƠNG THỨC THANH TOÁN',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.montserrat(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 2.0,
                                  color: AppTheme.mutedSilver,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Thiết lập thanh toán ưu tiên',
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
                      'Chọn cách thanh toán mặc định cho đơn hàng tiếp theo. Màn này tập trung vào hai lựa chọn gọn nhất: COD và PayOS online.',
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        height: 1.6,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.deepCharcoal.withValues(alpha: 0.72),
                      ),
                    ),
                    const SizedBox(height: 18),
                    _PaymentHeroCard(
                      totalCount: _methods.length,
                      defaultTitle: defaultMethod?.title ?? 'Chưa thiết lập',
                      summary:
                          defaultMethod?.details ??
                          'Hãy chọn một phương thức để checkout nhanh hơn.',
                    ),
                    const SizedBox(height: 18),
                    const _PaymentSectionTitle(
                      eyebrow: 'THIẾT LẬP ĐÃ LƯU',
                      title: 'COD hoặc thanh toán online qua PayOS',
                    ),
                    const SizedBox(height: 14),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
              sliver: SliverList.list(
                children: [
                  for (final method in _methods) ...[
                    _ManagedPaymentCard(
                      method: method,
                      onSetDefault: method.isDefault
                          ? null
                          : () => _setDefault(method.id),
                      onToggleEnabled: (value) =>
                          _toggleEnabled(method.id, value),
                      onEdit: () => _editMethod(method),
                    ),
                    const SizedBox(height: 14),
                  ],
                  const _PayOsInfoCard(),
                ],
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
            text: 'Xác nhận thiết lập',
            trailingIcon: Icons.check_rounded,
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Thiết lập phương thức thanh toán đã được lưu'),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _PaymentHeroCard extends StatelessWidget {
  final int totalCount;
  final String defaultTitle;
  final String summary;

  const _PaymentHeroCard({
    required this.totalCount,
    required this.defaultTitle,
    required this.summary,
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
                  '$totalCount lựa chọn thanh toán',
                  style: GoogleFonts.montserrat(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
              ),
              const Spacer(),
              const Icon(Icons.payments_outlined, color: AppTheme.deepCharcoal),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            'Ưu tiên hiện tại: $defaultTitle.',
            style: GoogleFonts.playfairDisplay(
              fontSize: 28,
              height: 1.05,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            summary,
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

class _PaymentSectionTitle extends StatelessWidget {
  final String eyebrow;
  final String title;

  const _PaymentSectionTitle({required this.eyebrow, required this.title});

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

class _ManagedPaymentCard extends StatelessWidget {
  final _SavedPaymentMethod method;
  final VoidCallback? onSetDefault;
  final ValueChanged<bool> onToggleEnabled;
  final VoidCallback onEdit;

  const _ManagedPaymentCard({
    required this.method,
    required this.onSetDefault,
    required this.onToggleEnabled,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: method.isDefault
              ? method.accentColor.withValues(alpha: 0.3)
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
                  color: method.accentColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  _iconForMethod(method.type),
                  color: method.accentColor,
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
                          method.title,
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.deepCharcoal,
                          ),
                        ),
                        if (method.isDefault)
                          _ManagedStatusChip(
                            label: 'Mặc định',
                            color: method.accentColor,
                          ),
                        _ManagedStatusChip(
                          label: method.statusLabel,
                          color: method.isEnabled
                              ? method.accentColor
                              : AppTheme.mutedSilver,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      method.subtitle,
                      style: GoogleFonts.montserrat(
                        fontSize: 12,
                        height: 1.5,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.deepCharcoal.withValues(alpha: 0.72),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.ivoryBackground,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Text(
              method.details,
              style: GoogleFonts.montserrat(
                fontSize: 11,
                height: 1.5,
                fontWeight: FontWeight.w500,
                color: AppTheme.mutedSilver,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Kích hoạt phương thức',
                      style: GoogleFonts.montserrat(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      method.type == _ManagedPaymentType.payos
                          ? 'Cho phép thanh toán online bằng PayOS tại bước checkout.'
                          : 'Giữ COD như một lựa chọn dự phòng khi nhận hàng.',
                      style: GoogleFonts.montserrat(
                        fontSize: 11,
                        height: 1.5,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Switch.adaptive(
                value: method.isEnabled,
                activeThumbColor: AppTheme.accentGold,
                onChanged: (value) => onToggleEnabled(value),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (onSetDefault != null)
                OutlinedButton.icon(
                  onPressed: onSetDefault,
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: const Text('Đặt mặc định'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: method.accentColor,
                    side: BorderSide(color: method.accentColor),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
              TextButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.tune_rounded, size: 16),
                label: const Text('Chỉnh sửa'),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.deepCharcoal,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ManagedStatusChip extends StatelessWidget {
  final String label;
  final Color color;

  const _ManagedStatusChip({required this.label, required this.color});

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

class _PayOsInfoCard extends StatelessWidget {
  const _PayOsInfoCard();

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
            'Ghi chú cho PayOS',
            style: GoogleFonts.playfairDisplay(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'PayOS phù hợp khi bạn muốn mở cổng thanh toán nhanh, quét QR ngân hàng hoặc nhận xác nhận tức thì. COD vẫn nên giữ bật như một phương án dự phòng khi cần.',
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

class _PaymentMethodSheet extends StatefulWidget {
  final _SavedPaymentMethod method;

  const _PaymentMethodSheet({required this.method});

  @override
  State<_PaymentMethodSheet> createState() => _PaymentMethodSheetState();
}

class _PaymentMethodSheetState extends State<_PaymentMethodSheet> {
  late final TextEditingController _subtitleController;
  late final TextEditingController _detailsController;
  late final TextEditingController _statusController;
  late bool _isDefault;
  late bool _isEnabled;

  @override
  void initState() {
    super.initState();
    _subtitleController = TextEditingController(text: widget.method.subtitle);
    _detailsController = TextEditingController(text: widget.method.details);
    _statusController = TextEditingController(text: widget.method.statusLabel);
    _isDefault = widget.method.isDefault;
    _isEnabled = widget.method.isEnabled;
  }

  @override
  void dispose() {
    _subtitleController.dispose();
    _detailsController.dispose();
    _statusController.dispose();
    super.dispose();
  }

  void _save() {
    final subtitle = _subtitleController.text.trim();
    final details = _detailsController.text.trim();
    final status = _statusController.text.trim();

    if (subtitle.isEmpty || details.isEmpty || status.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng điền đủ thông tin cấu hình')),
      );
      return;
    }

    Navigator.of(context).pop(
      widget.method.copyWith(
        subtitle: subtitle,
        details: details,
        statusLabel: status,
        isDefault: _isDefault,
        isEnabled: _isEnabled,
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
                  widget.method.type == _ManagedPaymentType.payos
                      ? 'Chỉnh sửa PayOS online'
                      : 'Chỉnh sửa COD',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 26,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Tùy chỉnh mô tả, trạng thái hiển thị và mức ưu tiên của phương thức này trong hồ sơ.',
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.mutedSilver,
                  ),
                ),
                const SizedBox(height: 18),
                _PaymentField(
                  controller: _subtitleController,
                  label: 'Mô tả ngắn',
                  hint: 'Mô tả cách dùng phương thức này',
                ),
                const SizedBox(height: 12),
                _PaymentField(
                  controller: _statusController,
                  label: 'Nhãn trạng thái',
                  hint: 'Ví dụ: Đang bật, Dự phòng',
                ),
                const SizedBox(height: 12),
                _PaymentField(
                  controller: _detailsController,
                  label: 'Thông tin chi tiết',
                  hint: 'Ghi chú hiển thị trong card phương thức thanh toán',
                  maxLines: 3,
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Đặt làm mặc định',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  subtitle: Text(
                    'Phương thức này sẽ được ưu tiên hiển thị đầu tiên cho người dùng.',
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
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Đang kích hoạt',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  subtitle: Text(
                    'Nếu tắt, phương thức này sẽ không xuất hiện như lựa chọn khuyến nghị.',
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      height: 1.5,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                  trailing: Switch.adaptive(
                    value: _isEnabled,
                    activeThumbColor: AppTheme.accentGold,
                    onChanged: (value) => setState(() => _isEnabled = value),
                  ),
                  onTap: () => setState(() => _isEnabled = !_isEnabled),
                ),
                const SizedBox(height: 12),
                LuxuryButton(text: 'Lưu thay đổi', onPressed: _save),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PaymentField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;

  const _PaymentField({
    required this.controller,
    required this.label,
    required this.hint,
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

enum _ManagedPaymentType { payos, cod }

class _SavedPaymentMethod {
  final String id;
  final _ManagedPaymentType type;
  final String title;
  final String subtitle;
  final String statusLabel;
  final String details;
  final bool isDefault;
  final bool isEnabled;
  final Color accentColor;

  const _SavedPaymentMethod({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.statusLabel,
    required this.details,
    required this.isDefault,
    required this.isEnabled,
    required this.accentColor,
  });

  _SavedPaymentMethod copyWith({
    String? subtitle,
    String? statusLabel,
    String? details,
    bool? isDefault,
    bool? isEnabled,
  }) {
    return _SavedPaymentMethod(
      id: id,
      type: type,
      title: title,
      subtitle: subtitle ?? this.subtitle,
      statusLabel: statusLabel ?? this.statusLabel,
      details: details ?? this.details,
      isDefault: isDefault ?? this.isDefault,
      isEnabled: isEnabled ?? this.isEnabled,
      accentColor: accentColor,
    );
  }
}

IconData _iconForMethod(_ManagedPaymentType type) {
  switch (type) {
    case _ManagedPaymentType.payos:
      return Icons.qr_code_2_rounded;
    case _ManagedPaymentType.cod:
      return Icons.local_shipping_outlined;
  }
}
