import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:perfume_gpt_app/l10n/app_localizations.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSignIn = true;
  bool _showPassword = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleSocialLogin(Future<void> Function() loginFn) async {
    try {
      await loginFn();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Đăng nhập thất bại: $e')));
      }
    }
  }

  Future<void> _handleContinue() async {
    final l10n = AppLocalizations.of(context)!;
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l10n.pleaseProvideCredentials)));
      return;
    }

    try {
      await ref.read(authControllerProvider.notifier).login(email, password);
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

    return Scaffold(
      body: Container(
        color: const Color(0xFFF5F1ED),
        child: SafeArea(
          child: SingleChildScrollView(
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
                        'Chào mừng đến với\nPerfumeGPT',
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
                        'Trợ lý mùi hương AI dành riêng cho bạn',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.montserrat(
                          fontSize: 14,
                          fontWeight: FontWeight.w300,
                          color: const Color(0xFF999999),
                          letterSpacing: 0.5,
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Auth Mode Toggle
                      _buildAuthToggle(),

                      const SizedBox(height: 28),

                      // Email Input
                      _buildEmailField(),

                      const SizedBox(height: 16),

                      // Password Input
                      _buildPasswordField(),

                      const SizedBox(height: 8),

                      // Forgot Password Link
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => context.push('/forgot-password'),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Quên mật khẩu?',
                            style: GoogleFonts.montserrat(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFFD4AF37),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Continue Button
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
                              : _handleContinue,
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
                                  'Tiếp tục →',
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
                            padding: const EdgeInsets.symmetric(horizontal: 16),
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
                            onPressed: () => _handleSocialLogin(
                              ref
                                  .read(authControllerProvider.notifier)
                                  .signInWithGoogle,
                            ),
                          ),
                          const SizedBox(width: 20),
                          _buildSocialButton(
                            icon: FontAwesomeIcons.facebookF,
                            onPressed: () => _handleSocialLogin(
                              ref
                                  .read(authControllerProvider.notifier)
                                  .signInWithFacebook,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 32),

                      // Footer Text
                      RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: GoogleFonts.montserrat(
                            fontSize: 11,
                            fontWeight: FontWeight.w300,
                            color: const Color(0xFF999999),
                          ),
                          children: [
                            const TextSpan(
                              text: 'Khi tiếp tục, bạn đồng ý với ',
                            ),
                            TextSpan(
                              text: 'Điều khoản dịch vụ',
                              style: GoogleFonts.montserrat(
                                fontSize: 11,
                                fontWeight: FontWeight.w300,
                                color: const Color(0xFF999999),
                                decoration: TextDecoration.underline,
                              ),
                            ),
                            const TextSpan(text: ' và '),
                            TextSpan(
                              text: 'Chính sách bảo mật',
                              style: GoogleFonts.montserrat(
                                fontSize: 11,
                                fontWeight: FontWeight.w300,
                                color: const Color(0xFF999999),
                                decoration: TextDecoration.underline,
                              ),
                            ),
                            const TextSpan(text: '.'),
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

  Widget _buildAuthToggle() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF0EAE3),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: const Color(0xFFE8D5B7), width: 1),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _isSignIn = true),
              child: Container(
                decoration: BoxDecoration(
                  color: _isSignIn ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(22),
                ),
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  'Đăng nhập',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _isSignIn
                        ? const Color(0xFF1A1A1A)
                        : const Color(0xFF999999),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => context.push('/register'),
              child: Container(
                decoration: BoxDecoration(
                  color: !_isSignIn ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(22),
                ),
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  'Tạo tài khoản',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: !_isSignIn
                        ? const Color(0xFF1A1A1A)
                        : const Color(0xFF999999),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmailField() {
    return TextField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      style: GoogleFonts.montserrat(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: const Color(0xFF1A1A1A),
      ),
      decoration: InputDecoration(
        hintText: 'Địa chỉ email',
        hintStyle: GoogleFonts.montserrat(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: const Color(0xFFCCCCCC),
        ),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 16, right: 12),
          child: Icon(
            Icons.mail_outline,
            color: const Color(0xFFD4AF37),
            size: 20,
          ),
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
