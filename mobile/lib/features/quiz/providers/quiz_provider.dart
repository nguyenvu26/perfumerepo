import 'package:flutter_riverpod/flutter_riverpod.dart';

class QuizQuestion {
  final String text;
  final List<QuizOption> options;

  const QuizQuestion({required this.text, required this.options});
}

class QuizOption {
  final String title;
  final String icon;

  const QuizOption({required this.title, required this.icon});
}

class QuizState {
  final int currentStep;
  final Map<int, int> answers; // step → selected option index
  final bool isComplete;

  const QuizState({
    this.currentStep = 0,
    this.answers = const {},
    this.isComplete = false,
  });

  int get totalSteps => questions.length;
  bool get canGoBack => currentStep > 0;

  QuizState copyWith({
    int? currentStep,
    Map<int, int>? answers,
    bool? isComplete,
  }) {
    return QuizState(
      currentStep: currentStep ?? this.currentStep,
      answers: answers ?? this.answers,
      isComplete: isComplete ?? this.isComplete,
    );
  }

  static const List<QuizQuestion> questions = [
    QuizQuestion(
      text: 'Mùi hương này dành cho dịp nào?',
      options: [
        QuizOption(title: 'Dạ tiệc buổi tối sang trọng', icon: 'nightlife'),
        QuizOption(
          title: 'Môi trường làm việc chuyên nghiệp',
          icon: 'business_center',
        ),
        QuizOption(title: 'Bữa brunch cuối tuần thoải mái', icon: 'wb_sunny'),
        QuizOption(title: 'Buổi hẹn hò riêng tư', icon: 'favorite'),
      ],
    ),
    QuizQuestion(
      text: 'Mức ngân sách bạn mong muốn là bao nhiêu?',
      options: [
        QuizOption(title: 'Dưới 1 triệu', icon: 'savings'),
        QuizOption(title: '1 – 3 triệu', icon: 'account_balance_wallet'),
        QuizOption(title: '3 – 5 triệu', icon: 'diamond'),
        QuizOption(title: 'Trên 5 triệu', icon: 'workspace_premium'),
      ],
    ),
    QuizQuestion(
      text: 'Bạn yêu thích nhóm hương nào nhất?',
      options: [
        QuizOption(title: 'Hương gỗ ấm áp', icon: 'park'),
        QuizOption(title: 'Hương hoa thanh lịch', icon: 'local_florist'),
        QuizOption(title: 'Hương tươi mát', icon: 'air'),
        QuizOption(title: 'Hương ngọt quyến rũ', icon: 'cake'),
      ],
    ),
    QuizQuestion(
      text: 'Bạn muốn độ lưu hương kéo dài tới mức nào?',
      options: [
        QuizOption(title: '2–4 giờ (nhẹ nhàng)', icon: 'schedule'),
        QuizOption(title: '4–6 giờ (vừa phải)', icon: 'timelapse'),
        QuizOption(title: '6–8 giờ (bền bỉ)', icon: 'timer'),
        QuizOption(title: 'Trên 8 giờ (cực lâu)', icon: 'hourglass_full'),
      ],
    ),
    QuizQuestion(
      text: 'Hãy mô tả tính cách của bạn bằng một từ.',
      options: [
        QuizOption(title: 'Bí ẩn', icon: 'visibility_off'),
        QuizOption(title: 'Năng động', icon: 'bolt'),
        QuizOption(title: 'Lãng mạn', icon: 'favorite_border'),
        QuizOption(title: 'Thanh lịch', icon: 'auto_awesome'),
      ],
    ),
  ];
}

class QuizNotifier extends StateNotifier<QuizState> {
  QuizNotifier() : super(const QuizState());

  void selectOption(int optionIndex) {
    final updated = Map<int, int>.from(state.answers);
    updated[state.currentStep] = optionIndex;

    if (state.currentStep < state.totalSteps - 1) {
      state = state.copyWith(
        answers: updated,
        currentStep: state.currentStep + 1,
      );
    } else {
      state = state.copyWith(answers: updated, isComplete: true);
    }
  }

  void goBack() {
    if (state.canGoBack) {
      state = state.copyWith(currentStep: state.currentStep - 1);
    }
  }

  void reset() {
    state = const QuizState();
  }
}

final quizProvider = StateNotifierProvider.autoDispose<QuizNotifier, QuizState>(
  (ref) => QuizNotifier(),
);
