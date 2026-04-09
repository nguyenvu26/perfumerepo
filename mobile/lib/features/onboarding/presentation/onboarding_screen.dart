import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/onboarding_provider.dart';
import 'package:perfume_gpt_app/l10n/app_localizations.dart';

/// Data model for each onboarding slide.
class _SlideData {
  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> gradientColors;
  final Color accentColor;

  const _SlideData({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.gradientColors,
    required this.accentColor,
  });
}

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  late final AnimationController _contentAnimCtrl;
  late final Animation<double> _fadeAnim;
  late final Animation<Offset> _slideAnim;

  late final AnimationController _floatAnimCtrl;
  late final Animation<double> _floatAnim;

  @override
  void initState() {
    super.initState();
    _contentAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(
      parent: _contentAnimCtrl,
      curve: Curves.easeOut,
    );
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero)
        .animate(
          CurvedAnimation(parent: _contentAnimCtrl, curve: Curves.easeOutCubic),
        );
    _contentAnimCtrl.forward();

    _floatAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
    _floatAnim = Tween<double>(
      begin: -8,
      end: 8,
    ).animate(CurvedAnimation(parent: _floatAnimCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _contentAnimCtrl.dispose();
    _floatAnimCtrl.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() => _currentPage = index);
    _contentAnimCtrl.reset();
    _contentAnimCtrl.forward();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final size = MediaQuery.of(context).size;
    final bottomPad = MediaQuery.of(context).padding.bottom;

    final slides = [
      _SlideData(
        title: l10n.onboarding1Title,
        subtitle: l10n.onboarding1Subtitle,
        icon: Icons.spa_outlined,
        gradientColors: [
          const Color(0xFFFDF6EE),
          const Color(0xFFF5E6D0),
          const Color(0xFFEDD5B3),
        ],
        accentColor: const Color(0xFFD4A574),
      ),
      _SlideData(
        title: l10n.onboarding2Title,
        subtitle: l10n.onboarding2Subtitle,
        icon: Icons.auto_awesome_outlined,
        gradientColors: [
          const Color(0xFFF0EDE8),
          const Color(0xFFE0D8CC),
          const Color(0xFFD0C4B0),
        ],
        accentColor: const Color(0xFFB8A080),
      ),
      _SlideData(
        title: l10n.onboarding3Title,
        subtitle: l10n.onboarding3Subtitle,
        icon: Icons.diamond_outlined,
        gradientColors: [
          const Color(0xFFF2ECF9),
          const Color(0xFFE8DEEF),
          const Color(0xFFD5C4E0),
        ],
        accentColor: const Color(0xFFAA8EC4),
      ),
    ];

    final slide = slides[_currentPage];

    return Scaffold(
      body: Stack(
        children: [
          // ── Animated gradient background ──
          AnimatedContainer(
            duration: const Duration(milliseconds: 700),
            curve: Curves.easeInOut,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: slide.gradientColors,
              ),
            ),
          ),

          // ── Decorative circles ──
          ..._buildDecorativeElements(size, slide),

          // ── Page swipe area (invisible, for gesture) ──
          PageView.builder(
            controller: _pageController,
            onPageChanged: _onPageChanged,
            itemCount: slides.length,
            itemBuilder: (_, __) => const SizedBox.expand(),
          ),

          // ── Top bar: brand + skip ──
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.appName.toUpperCase(),
                    style: GoogleFonts.montserrat(
                      fontSize: 14,
                      fontWeight: FontWeight.w300,
                      letterSpacing: 8,
                      color: AppTheme.deepCharcoal.withValues(alpha: 0.5),
                    ),
                  ),
                  if (_currentPage < slides.length - 1)
                    GestureDetector(
                      onTap: () async {
                        await ref
                            .read(onboardingProvider.notifier)
                            .completeOnboarding();
                        if (context.mounted) context.go('/login');
                      },
                      child: Text(
                        'BỎ QUA',
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 2,
                          color: AppTheme.deepCharcoal.withValues(alpha: 0.4),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // ── Center icon ──
          Positioned(
            top: size.height * 0.18,
            left: 0,
            right: 0,
            child: AnimatedBuilder(
              animation: _floatAnim,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, _floatAnim.value),
                  child: child,
                );
              },
              child: _buildCenterVisual(slide, size),
            ),
          ),

          // ── Bottom content ──
          Positioned(
            bottom: bottomPad + 40,
            left: 28,
            right: 28,
            child: FadeTransition(
              opacity: _fadeAnim,
              child: SlideTransition(
                position: _slideAnim,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Dot indicators
                    _buildIndicators(slides.length),
                    const SizedBox(height: 28),

                    // Title
                    Text(
                      slide.title,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 34,
                        fontWeight: FontWeight.w700,
                        height: 1.15,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Subtitle
                    Text(
                      slide.subtitle,
                      style: GoogleFonts.montserrat(
                        fontSize: 15,
                        fontWeight: FontWeight.w300,
                        height: 1.6,
                        color: AppTheme.deepCharcoal.withValues(alpha: 0.6),
                      ),
                    ),
                    const SizedBox(height: 36),

                    // Buttons
                    _buildButtons(context, l10n, slides, slide),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCenterVisual(_SlideData slide, Size size) {
    return Center(
      child: Container(
        width: size.width * 0.52,
        height: size.width * 0.52,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              slide.accentColor.withValues(alpha: 0.15),
              slide.accentColor.withValues(alpha: 0.05),
              Colors.transparent,
            ],
          ),
        ),
        child: Center(
          child: Container(
            width: size.width * 0.32,
            height: size.width * 0.32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.6),
              boxShadow: [
                BoxShadow(
                  color: slide.accentColor.withValues(alpha: 0.2),
                  blurRadius: 40,
                  spreadRadius: 10,
                ),
              ],
            ),
            child: Icon(slide.icon, size: 48, color: slide.accentColor),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildDecorativeElements(Size size, _SlideData slide) {
    return [
      // Top-right circle
      Positioned(
        top: -size.width * 0.2,
        right: -size.width * 0.15,
        child: Container(
          width: size.width * 0.6,
          height: size.width * 0.6,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: slide.accentColor.withValues(alpha: 0.06),
          ),
        ),
      ),
      // Bottom-left circle
      Positioned(
        bottom: -size.width * 0.1,
        left: -size.width * 0.2,
        child: Container(
          width: size.width * 0.5,
          height: size.width * 0.5,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: slide.accentColor.withValues(alpha: 0.04),
          ),
        ),
      ),
      // Small floating accent
      AnimatedBuilder(
        animation: _floatAnim,
        builder: (context, child) {
          return Positioned(
            top: size.height * 0.12,
            right: size.width * 0.12,
            child: Transform.rotate(
              angle: _floatAnim.value * math.pi / 180,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: slide.accentColor.withValues(alpha: 0.3),
                ),
              ),
            ),
          );
        },
      ),
    ];
  }

  Widget _buildIndicators(int count) {
    return Row(
      children: List.generate(count, (i) {
        final isActive = i == _currentPage;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.only(right: 8),
          height: 3,
          width: isActive ? 32 : 12,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(2),
            color: isActive
                ? AppTheme.champagneGold
                : AppTheme.deepCharcoal.withValues(alpha: 0.15),
          ),
        );
      }),
    );
  }

  Widget _buildButtons(
    BuildContext context,
    AppLocalizations l10n,
    List<_SlideData> slides,
    _SlideData currentSlide,
  ) {
    final isLast = _currentPage == slides.length - 1;

    if (isLast) {
      return SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: () async {
            await ref.read(onboardingProvider.notifier).completeOnboarding();
            if (context.mounted) context.go('/login');
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.deepCharcoal,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            textStyle: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              letterSpacing: 2,
            ),
          ),
          child: Text(l10n.beginJourney),
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 56,
            child: OutlinedButton(
              onPressed: () => _pageController.nextPage(
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeInOutCubic,
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(
                  color: AppTheme.deepCharcoal.withValues(alpha: 0.15),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    l10n.next,
                    style: GoogleFonts.montserrat(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 2,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 18,
                    color: AppTheme.deepCharcoal.withValues(alpha: 0.6),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
