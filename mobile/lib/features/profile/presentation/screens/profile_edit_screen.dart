import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/widgets/app_input.dart';
import '../../../../core/widgets/app_button.dart';
import '../../models/user_profile.dart';
import '../../providers/profile_provider.dart';
import '../../providers/profile_edit_provider.dart';

/// Profile Edit Screen
///
/// Allows the user to update their personal information:
/// full name, phone number, gender, and date of birth.
/// Calls PATCH /users/me directly — no mock data.
class ProfileEditScreen extends ConsumerWidget {
  const ProfileEditScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);

    return profileAsync.when(
      data: (profile) {
        if (profile == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Chỉnh sửa hồ sơ')),
            body: const Center(child: Text('Vui lòng đăng nhập.')),
          );
        }
        return _ProfileEditForm(profile: profile);
      },
      loading: () => Scaffold(
        backgroundColor: AppTheme.ivoryBackground,
        appBar: _buildAppBar(context),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        backgroundColor: AppTheme.ivoryBackground,
        appBar: _buildAppBar(context),
        body: Center(child: Text('Lỗi: $e')),
      ),
    );
  }

  AppBar _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: AppTheme.ivoryBackground,
      elevation: 0,
      scrolledUnderElevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
        onPressed: () => Navigator.pop(context),
        color: AppTheme.deepCharcoal,
      ),
      title: Text(
        'Chỉnh sửa hồ sơ',
        style: GoogleFonts.playfairDisplay(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppTheme.deepCharcoal,
        ),
      ),
      centerTitle: true,
    );
  }
}

class _ProfileEditForm extends ConsumerStatefulWidget {
  final UserProfile profile;

  const _ProfileEditForm({required this.profile});

  @override
  ConsumerState<_ProfileEditForm> createState() => _ProfileEditFormState();
}

class _ProfileEditFormState extends ConsumerState<_ProfileEditForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _dobController;

  String? _selectedGender;
  DateTime? _selectedDob;

  static const _genderOptions = [
    ('male', 'Nam'),
    ('female', 'Nữ'),
    ('other', 'Khác'),
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.profile.name);
    _phoneController = TextEditingController(text: widget.profile.phone ?? '');
    _selectedGender = widget.profile.gender;
    _selectedDob = widget.profile.dateOfBirth;
    _dobController = TextEditingController(
      text: _selectedDob != null
          ? DateFormat('dd/MM/yyyy').format(_selectedDob!)
          : '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDob ?? DateTime(now.year - 18),
      firstDate: DateTime(1900),
      lastDate: now,
      locale: const Locale('vi', 'VN'),
      helpText: 'Chọn ngày sinh',
      cancelText: 'Hủy',
      confirmText: 'Xác nhận',
    );
    if (picked != null) {
      setState(() {
        _selectedDob = picked;
        _dobController.text = DateFormat('dd/MM/yyyy').format(picked);
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      await ref
          .read(profileEditProvider.notifier)
          .save(
            fullName: _nameController.text,
            phone: _phoneController.text,
            gender: _selectedGender,
            dateOfBirth: _selectedDob?.toIso8601String(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Hồ sơ đã được cập nhật',
              style: GoogleFonts.montserrat(color: Colors.white),
            ),
            backgroundColor: AppTheme.accentGold,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: AppRadius.cardBorder),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Cập nhật thất bại: $e',
              style: GoogleFonts.montserrat(color: Colors.white),
            ),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final saveState = ref.watch(profileEditProvider);
    final isLoading = saveState.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        backgroundColor: AppTheme.ivoryBackground,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: isLoading ? null : () => Navigator.pop(context),
          color: AppTheme.deepCharcoal,
        ),
        title: Text(
          'Chỉnh sửa hồ sơ',
          style: GoogleFonts.playfairDisplay(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppTheme.deepCharcoal,
          ),
        ),
        centerTitle: true,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          children: [
            _AvatarSection(avatarUrl: widget.profile.avatarUrl),
            const SizedBox(height: 32),
            _SectionLabel('Thông tin cá nhân'),
            const SizedBox(height: 16),
            AppInput(
              label: 'Họ và tên',
              hint: 'Nhập họ và tên của bạn',
              controller: _nameController,
              prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
              validator: (v) {
                if (v == null || v.trim().isEmpty) {
                  return 'Vui lòng nhập họ và tên';
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            AppInput(
              label: 'Email',
              hint: widget.profile.email,
              initialValue: widget.profile.email,
              readOnly: true,
              enabled: false,
              prefixIcon: const Icon(Icons.email_outlined, size: 20),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            AppInput(
              label: 'Số điện thoại',
              hint: 'Ví dụ: 0912345678',
              controller: _phoneController,
              prefixIcon: const Icon(Icons.phone_outlined, size: 20),
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              validator: (v) {
                if (v != null && v.isNotEmpty && v.length < 9) {
                  return 'Số điện thoại không hợp lệ';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            _SectionLabel('Thông tin bổ sung'),
            const SizedBox(height: 16),
            _GenderSelector(
              selected: _selectedGender,
              options: _genderOptions,
              onChanged: (v) => setState(() => _selectedGender = v),
            ),
            const SizedBox(height: 16),
            AppInput(
              label: 'Ngày sinh',
              hint: 'DD/MM/YYYY',
              controller: _dobController,
              readOnly: true,
              prefixIcon: const Icon(Icons.cake_outlined, size: 20),
              onTap: _pickDate,
            ),
            const SizedBox(height: 40),
            AppButton(
              text: 'Lưu thay đổi',
              isLoading: isLoading,
              onPressed: isLoading ? null : _save,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

// ─── Sub-widgets ────────────────────────────────────────────────────────────

class _AvatarSection extends StatelessWidget {
  final String? avatarUrl;

  const _AvatarSection({this.avatarUrl});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Stack(
        alignment: Alignment.bottomRight,
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.accentGold.withValues(alpha: 0.4),
                width: 2.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.deepCharcoal.withValues(alpha: 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipOval(
              child: avatarUrl != null
                  ? Image.network(
                      avatarUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildPlaceholder(),
                    )
                  : _buildPlaceholder(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: AppTheme.ivoryBackground,
      child: Icon(Icons.person_outline, size: 40, color: AppTheme.mutedSilver),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;

  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.montserrat(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.8,
        color: AppTheme.mutedSilver,
      ),
    );
  }
}

class _GenderSelector extends StatelessWidget {
  final String? selected;
  final List<(String, String)> options;
  final ValueChanged<String?> onChanged;

  const _GenderSelector({
    required this.selected,
    required this.options,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Giới tính',
          style: GoogleFonts.montserrat(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppTheme.deepCharcoal,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: options
              .map(
                (opt) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _GenderChip(
                      label: opt.$2,
                      value: opt.$1,
                      isSelected: selected == opt.$1,
                      onTap: () =>
                          onChanged(selected == opt.$1 ? null : opt.$1),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _GenderChip extends StatelessWidget {
  final String label;
  final String value;
  final bool isSelected;
  final VoidCallback onTap;

  const _GenderChip({
    required this.label,
    required this.value,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.accentGold.withValues(alpha: 0.12)
              : Colors.white,
          borderRadius: AppRadius.inputBorder,
          border: Border.all(
            color: isSelected
                ? AppTheme.accentGold
                : AppTheme.mutedSilver.withValues(alpha: 0.4),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              color: isSelected ? AppTheme.accentGold : AppTheme.deepCharcoal,
            ),
          ),
        ),
      ),
    );
  }
}
