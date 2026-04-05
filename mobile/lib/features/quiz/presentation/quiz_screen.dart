import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/main_shell.dart';
import '../providers/quiz_provider.dart';

class QuizScreen extends ConsumerWidget {
  const QuizScreen({super.key});

  static const _iconMap = <String, IconData>{
    'nightlife': Icons.nightlife,
    'business_center': Icons.business_center,
    'wb_sunny': Icons.wb_sunny,
    'favorite': Icons.favorite,
    'savings': Icons.savings,
    'account_balance_wallet': Icons.account_balance_wallet,
    'diamond': Icons.diamond,
    'workspace_premium': Icons.workspace_premium,
    'park': Icons.park,
    'local_florist': Icons.local_florist,
    'air': Icons.air,
    'cake': Icons.cake,
    'schedule': Icons.schedule,
    'timelapse': Icons.timelapse,
    'timer': Icons.timer,
    'hourglass_full': Icons.hourglass_full,
    'visibility_off': Icons.visibility_off,
    'bolt': Icons.bolt,
    'favorite_border': Icons.favorite_border,
    'auto_awesome': Icons.auto_awesome,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quizState = ref.watch(quizProvider);
    final brightness = Theme.of(context).brightness;

    // Navigate to main shell when quiz is complete
    ref.listen<QuizState>(quizProvider, (prev, next) {
      if (next.isComplete && !(prev?.isComplete ?? false)) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const MainShell()),
        );
      }
    });

    final question = QuizState.questions[quizState.currentStep];
    final selectedAnswer = quizState.answers[quizState.currentStep];

    return Scaffold(
      body: Container(
        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 80),
        decoration: BoxDecoration(
          gradient: AppTheme.getLuxuryGradient(brightness),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress Indicator
            Row(
              children: List.generate(
                quizState.totalSteps,
                (index) => Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.only(right: 4),
                    color: index <= quizState.currentStep
                        ? Theme.of(context).primaryColor
                        : Theme.of(context).colorScheme.outline,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Back button + step indicator
            Row(
              children: [
                if (quizState.canGoBack)
                  GestureDetector(
                    onTap: () => ref.read(quizProvider.notifier).goBack(),
                    child: Icon(
                      Icons.arrow_back_ios,
                      size: 16,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                if (quizState.canGoBack) const SizedBox(width: 12),
                Text(
                  'BUOC ${quizState.currentStep + 1} / ${quizState.totalSteps}',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Question
            Text(
              question.text,
              style: Theme.of(context).textTheme.displayLarge,
            ),
            const SizedBox(height: 60),

            // Options
            Expanded(
              child: ListView.builder(
                itemCount: question.options.length,
                itemBuilder: (_, index) {
                  final option = question.options[index];
                  final isSelected = selectedAnswer == index;
                  return QuizOptionTile(
                    title: option.title,
                    icon: _iconMap[option.icon] ?? Icons.circle,
                    isSelected: isSelected,
                    onTap: () =>
                        ref.read(quizProvider.notifier).selectOption(index),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class QuizOptionTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const QuizOptionTile({
    super.key,
    required this.title,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20.0),
      child: InkWell(
        onTap: onTap,
        child: GlassContainer(
          padding: const EdgeInsets.all(24),
          opacity: isSelected ? 0.25 : 0.1,
          borderRadius: 8,
          child: Row(
            children: [
              Icon(icon, color: Theme.of(context).primaryColor, size: 24),
              const SizedBox(width: 20),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight:
                        isSelected ? FontWeight.w700 : FontWeight.w500,
                    letterSpacing: 1,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
              Icon(
                isSelected
                    ? Icons.check_circle
                    : Icons.arrow_forward_ios,
                color: isSelected
                    ? Theme.of(context).primaryColor
                    : Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.3),
                size: 14,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
