import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/chat_provider.dart';
import 'widgets/ai_message_bubble.dart';
import 'widgets/user_message_bubble.dart';
import 'widgets/suggestion_chip.dart';

class ConsultationScreen extends ConsumerStatefulWidget {
  const ConsultationScreen({super.key});

  @override
  ConsumerState<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends ConsumerState<ConsultationScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Initialize after first frame so the provider is ready
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatProvider.notifier).init();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    _messageController.clear();
    ref.read(chatProvider.notifier).sendMessage(text);
    // Scroll to bottom after state update
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);

    // Scroll to bottom when new message arrives
    ref.listen(chatProvider, (prev, next) {
      if (prev?.messages.length != next.messages.length) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
      }
    });

    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: AppTheme.ivoryBackground,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          //  Header
          _ChatHeader(onClose: () => Navigator.pop(context)),

          //  Messages
          Expanded(
            child: chatState.isInitializing
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppTheme.accentGold,
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(20),
                    itemCount:
                        chatState.messages.length +
                        (chatState.isSending ? 1 : 0),
                    itemBuilder: (context, index) {
                      // Typing indicator
                      if (index == chatState.messages.length) {
                        return const _TypingIndicator();
                      }
                      final message = chatState.messages[index];
                      return message.isAI
                          ? AiMessageBubble(message: message)
                          : UserMessageBubble(message: message);
                    },
                  ),
          ),

          //  Error banner
          if (chatState.sendError != null)
            _ErrorBanner(
              message: chatState.sendError!,
              onDismiss: () => ref.read(chatProvider.notifier).clearError(),
            ),

          //  Suggestion chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  SuggestionChip(
                    label: 'Gợi ý bất ngờ',
                    icon: Icons.casino_outlined,
                    onTap: () {
                      _messageController.text =
                          'Gợi ý cho tôi một mùi hương bất ngờ';
                      _sendMessage();
                    },
                  ),
                  const SizedBox(width: 8),
                  SuggestionChip(
                    label: 'Dưới \$150',
                    icon: Icons.attach_money,
                    onTap: () {
                      _messageController.text = 'Gợi ý nước hoa dưới 150 đô la';
                      _sendMessage();
                    },
                  ),
                  const SizedBox(width: 8),
                  SuggestionChip(
                    label: 'Hương cho buổi tối',
                    icon: Icons.nightlight_outlined,
                    onTap: () {
                      _messageController.text =
                          'Mùi hương phù hợp cho buổi tối';
                      _sendMessage();
                    },
                  ),
                ],
              ),
            ),
          ),

          //  Input
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.creamWhite,
              border: Border(
                top: BorderSide(color: AppTheme.softTaupe, width: 1),
              ),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.ivoryBackground,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppTheme.softTaupe, width: 1),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.mic_none,
                            color: AppTheme.mutedSilver,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              decoration: InputDecoration(
                                hintText: 'Mô tả tâm trạng của bạn...',
                                border: InputBorder.none,
                                hintStyle: GoogleFonts.montserrat(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w400,
                                  color: AppTheme.mutedSilver,
                                ),
                              ),
                              style: GoogleFonts.montserrat(
                                fontSize: 14,
                                color: AppTheme.deepCharcoal,
                              ),
                              onSubmitted: (_) => _sendMessage(),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: (chatState.isSending || chatState.isInitializing)
                        ? null
                        : _sendMessage,
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: chatState.isSending
                            ? AppTheme.mutedSilver
                            : AppTheme.accentGold,
                        shape: BoxShape.circle,
                      ),
                      child: chatState.isSending
                          ? const Padding(
                              padding: EdgeInsets.all(14),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  AppTheme.primaryDb,
                                ),
                              ),
                            )
                          : const Icon(
                              Icons.arrow_upward_rounded,
                              color: AppTheme.primaryDb,
                              size: 24,
                            ),
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
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

class _ChatHeader extends StatelessWidget {
  final VoidCallback onClose;
  const _ChatHeader({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        border: Border(bottom: BorderSide(color: AppTheme.softTaupe, width: 1)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.accentGold,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: AppTheme.primaryDb,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chuyên gia mùi hương',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'ĐANG HOẠT ĐỘNG',
                      style: GoogleFonts.montserrat(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: AppTheme.deepCharcoal),
            onPressed: onClose,
          ),
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.creamWhite,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
              border: Border.all(color: AppTheme.softTaupe),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '',
                  style: GoogleFonts.montserrat(
                    fontSize: 16,
                    color: AppTheme.mutedSilver,
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback onDismiss;
  const _ErrorBanner({required this.message, required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFF453A).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFFF453A).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFFF453A), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.montserrat(
                fontSize: 12,
                color: const Color(0xFFFF453A),
              ),
            ),
          ),
          GestureDetector(
            onTap: onDismiss,
            child: const Icon(Icons.close, color: Color(0xFFFF453A), size: 16),
          ),
        ],
      ),
    );
  }
}
