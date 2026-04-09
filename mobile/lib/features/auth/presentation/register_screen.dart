import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:perfume_gpt_app/l10n/app_localizations.dart';

import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _acceptedTerms = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _showSocialNotSupported() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Đăng nhập mạng xã hội hiện chưa được hỗ trợ với API hiện tại.',
        ),
      ),
    );
  }

  Future<void> _handleRegister() async {
    final l10n = AppLocalizations.of(context)!;
    final fullName = _fullNameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (fullName.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l10n.pleaseFillFields)));
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mật khẩu xác nhận không khớp.')),
      );
      return;
    }

    if (!_acceptedTerms) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l10n.pleaseAcceptTerms)));
      return;
    }

    try {
      await ref
          .read(authControllerProvider.notifier)
          .register(email: email, password: password, fullName: fullName);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(l10n.registrationSuccessful)));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('${l10n.accessDenied}: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: Container(
        color: const Color(0xFFF5F1ED),
        child: SafeArea(
          child: Stack(
            children: [
              SingleChildScrollView(
                child: Column(
                  children: [
                    // Header with Flowing Wave Effect
                    _buildWaveHeader(),

                    // Main Content
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: Column(
                        children: [
                          const SizedBox(height: 40),

                          // Title
                          Text(
                            'Tạo\nTài khoản',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 36,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF1A1A1A),
                              height: 1.2,
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Subtitle
                          Text(
                            'Gia nhập cộng đồng mùi hương tuyển chọn',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.montserrat(
                              fontSize: 14,
                              fontWeight: FontWeight.w300,
                              color: const Color(0xFF999999),
                              letterSpacing: 0.5,
                            ),
                          ),

                          const SizedBox(height: 32),

                          // Full Name Input
                          _buildInputField(
                            controller: _fullNameController,
                            hint: l10n.fullName,
                            icon: Icons.person_outline,
                          ),

                          const SizedBox(height: 16),

                          // Email Input
                          _buildInputField(
                            controller: _emailController,
                            hint: l10n.emailAddress,
                            icon: Icons.mail_outline,
                            keyboardType: TextInputType.emailAddress,
                          ),

                          const SizedBox(height: 16),

                          // Password Input
                          _buildPasswordField(),

                          const SizedBox(height: 16),

                          // Confirm Password Input
                          _buildConfirmPasswordField(),

                          const SizedBox(height: 24),

                          // Terms Checkbox
                          _buildTermsCheckbox(),

                          const SizedBox(height: 28),

                          // Create Account Button
                          SizedBox(
                            width: double.infinity,
                            height: 58,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE8D5B7),
                                foregroundColor: const Color(0xFF1A1A1A),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                              ),
                              onPressed: authState.isLoading
                                  ? null
                                  : _handleRegister,
                              child: authState.isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Color(0xFF1A1A1A),
                                      ),
                                    )
                                  : Text(
                                      'Tạo tài khoản',
                                      style: GoogleFonts.montserrat(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                            ),
                          ),

                          const SizedBox(height: 28),

                          // Divider
                          Row(
                            children: [
                              Expanded(
                                child: Divider(
                                  color: const Color(0xFFDDDDDD),
                                  thickness: 0.5,
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                                child: Text(
                                  'HOẶC TIẾP TỤC VỚI',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w400,
                                    color: const Color(0xFFAAAAAA),
                                    letterSpacing: 1,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Divider(
                                  color: const Color(0xFFDDDDDD),
                                  thickness: 0.5,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // Social Buttons
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _buildSocialButton(
                                icon: FontAwesomeIcons.google,
                                onPressed: _showSocialNotSupported,
                              ),
                              const SizedBox(width: 20),
                              _buildSocialButton(
                                icon: FontAwesomeIcons.facebookF,
                                onPressed: _showSocialNotSupported,
                              ),
                            ],
                          ),

                          const SizedBox(height: 32),

                          // Footer Navigation
                          RichText(
                            textAlign: TextAlign.center,
                            text: TextSpan(
                              style: GoogleFonts.montserrat(
                                fontSize: 13,
                                fontWeight: FontWeight.w300,
                                color: const Color(0xFF999999),
                              ),
                              children: [
                                const TextSpan(text: 'Đã có tài khoản? '),
                                TextSpan(
                                  text: 'Đăng nhập',
                                  style: GoogleFonts.montserrat(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF1A1A1A),
                                    decoration: TextDecoration.underline,
                                  ),
                                  recognizer: TapGestureRecognizer()
                                    ..onTap = () => context.pop(),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Back Button
              Positioned(
                top: 16,
                left: 16,
                child: GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    child: Icon(
                      Icons.arrow_back_ios_new,
                      color: const Color(0xFF1A1A1A),
                      size: 20,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWaveHeader() {
    return Container(
      height: 140,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFFF5F1ED).withValues(alpha: 0.5),
            const Color(0xFFF5F1ED),
          ],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -30,
            left: 0,
            right: 0,
            child: CustomPaint(
              size: const Size(double.infinity, 120),
              painter: _WavePainter(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: GoogleFonts.montserrat(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: const Color(0xFF1A1A1A),
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.montserrat(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: const Color(0xFFCCCCCC),
        ),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 16, right: 12),
          child: Icon(icon, color: const Color(0xFFD4AF37), size: 20),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFE8D5B7), width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFE8D5B7), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 1.5),
        ),
      ),
    );
  }

  Widget _buildPasswordField() {
    return TextField(
      controller: _passwordController,
      obscureText: !_showPassword,
      style: GoogleFonts.montserrat(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: const Color(0xFF1A1A1A),
      ),
      decoration: InputDecoration(
        hintText: 'Mật khẩu',
        hintStyle: GoogleFonts.montserrat(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: const Color(0xFFCCCCCC),
        ),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 16, right: 12),
          child: Icon(
            Icons.lock_outline,
            color: const Color(0xFFD4AF37),
            size: 20,
          ),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        suffixIcon: GestureDetector(
          onTap: () => setState(() => _showPassword = !_showPassword),
          child: Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Icon(
              _showPassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: const Color(0xFFAAAAAA),
              size: 20,
            ),
          ),
        ),
        suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFE8D5B7), width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFE8D5B7), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 1.5),
        ),
      ),
    );
  }

  Widget _buildConfirmPasswordField() {
    return TextField(
      controller: _confirmPasswordController,
      obscureText: !_showConfirmPassword,
      style: GoogleFonts.montserrat(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: const Color(0xFF1A1A1A),
      ),
      decoration: InputDecoration(
        hintText: 'Xác nhận mật khẩu',
        hintStyle: GoogleFonts.montserrat(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: const Color(0xFFCCCCCC),
        ),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 16, right: 12),
          child: Icon(
            Icons.lock_outline,
            color: const Color(0xFFD4AF37),
            size: 20,
          ),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        suffixIcon: GestureDetector(
          onTap: () =>
              setState(() => _showConfirmPassword = !_showConfirmPassword),
          child: Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Icon(
              _showConfirmPassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: const Color(0xFFAAAAAA),
              size: 20,
            ),
          ),
        ),
        suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFE8D5B7), width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFE8D5B7), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 1.5),
        ),
      ),
    );
  }

  Widget _buildTermsCheckbox() {
    return GestureDetector(
      onTap: () => setState(() => _acceptedTerms = !_acceptedTerms),
      child: Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: Checkbox(
              value: _acceptedTerms,
              activeColor: const Color(0xFFD4AF37),
              checkColor: const Color(0xFF1A1A1A),
              side: const BorderSide(color: Color(0xFFE8D5B7), width: 1.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(3),
              ),
              onChanged: (val) => setState(() => _acceptedTerms = val ?? false),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  fontWeight: FontWeight.w300,
                  color: const Color(0xFF666666),
                ),
                children: [
                  const TextSpan(text: 'Tôi đồng ý với '),
                  TextSpan(
                    text: 'Điều khoản dịch vụ',
                    style: GoogleFonts.montserrat(
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF1A1A1A),
                      decoration: TextDecoration.underline,
                    ),
                  ),
                  const TextSpan(text: ' và '),
                  TextSpan(
                    text: 'Chính sách bảo mật',
                    style: GoogleFonts.montserrat(
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF1A1A1A),
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFE8D5B7), width: 1),
        ),
        child: Center(
          child: FaIcon(
            icon,
            size: 20,
            color: icon == FontAwesomeIcons.google
                ? const Color(0xFFDB4437)
                : const Color(0xFF1877F2),
          ),
        ),
      ),
    );
  }
}

class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE8D5B7).withValues(alpha: 0.15)
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(0, 40);
    path.quadraticBezierTo(size.width * 0.25, 10, size.width * 0.5, 30);
    path.quadraticBezierTo(size.width * 0.75, 50, size.width, 20);
    path.lineTo(size.width, 0);
    path.lineTo(0, 0);
    path.close();

    canvas.drawPath(path, paint);

    final paint2 = Paint()
      ..color = const Color(0xFFD4AF37).withValues(alpha: 0.1)
      ..style = PaintingStyle.fill;

    final path2 = Path();
    path2.moveTo(0, 60);
    path2.quadraticBezierTo(size.width * 0.25, 35, size.width * 0.5, 55);
    path2.quadraticBezierTo(size.width * 0.75, 75, size.width, 45);
    path2.lineTo(size.width, 0);
    path2.lineTo(0, 0);
    path2.close();

    canvas.drawPath(path2, paint2);
  }

  @override
  bool shouldRepaint(_WavePainter oldDelegate) => false;
}
