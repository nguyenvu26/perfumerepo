import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/onboarding_provider.dart';
import 'package:perfume_gpt_app/l10n/app_localizations.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final List<Map<String, String>> onboardingData = [
      {
        'title': l10n.onboarding1Title,
        'subtitle': l10n.onboarding1Subtitle,
        'image': 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop',
      },
      {
        'title': l10n.onboarding2Title,
        'subtitle': l10n.onboarding2Subtitle,
        'image': 'https://images.unsplash.com/photo-1616948055599-91739c636f01?q=80&w=1000&auto=format&fit=crop',
      },
      {
        'title': l10n.onboarding3Title,
        'subtitle': l10n.onboarding3Subtitle,
        'image': 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop',
      },
    ];

    return Scaffold(
      body: Stack(
        children: [
          // Background Imagery with Cross-fade
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemCount: onboardingData.length,
            itemBuilder: (context, index) {
              return Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    onboardingData[index]['image']!,
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.5),
                          Theme.of(context).scaffoldBackgroundColor,
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          // Top Branding
          Positioned(
            top: 60,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                l10n.appName.toUpperCase(),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  letterSpacing: 12,
                  color: AppTheme.champagneGold,
                  fontWeight: FontWeight.w200,
                ),
              ),
            ),
          ),

          // Content Box
          Positioned(
            bottom: 60,
            left: 30,
            right: 30,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Animated Indices
                Row(
                  children: List.generate(
                    onboardingData.length,
                    (index) => AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.only(right: 8),
                      height: 2,
                      width: _currentPage == index ? 40 : 20,
                      color: _currentPage == index 
                          ? AppTheme.champagneGold 
                          : Theme.of(context).colorScheme.outline,
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                
                // Titles
                Text(
                  onboardingData[_currentPage]['title']!,
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    fontWeight: FontWeight.w200,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 20),
                
                // Subtitles
                Text(
                  onboardingData[_currentPage]['subtitle']!,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).textTheme.bodyLarge?.color?.withValues(alpha: 0.7),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 50),

                // Action Buttons
                Row(
                  children: [
                    if (_currentPage < onboardingData.length - 1)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _pageController.nextPage(
                            duration: const Duration(milliseconds: 500),
                            curve: Curves.easeInOut,
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Theme.of(context).colorScheme.outline),
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: Text(
                            l10n.next, 
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface, letterSpacing: 2),
                          ),
                        ),
                      )
                    else
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () async {
                            await ref.read(onboardingProvider.notifier).completeOnboarding();
                            if (context.mounted) context.go('/login');
                          },
                          child: Text(l10n.beginJourney),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
