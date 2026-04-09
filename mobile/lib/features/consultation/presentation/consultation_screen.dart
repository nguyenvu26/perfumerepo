import 'package:intl/intl.dart';
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

class _ConsultationScreenState extends ConsumerState<ConsultationScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late final AnimationController _drawerController;
  late final Animation<double> _drawerAnimation;
  bool _showHistory = false;

  @override
  void initState() {
    super.initState();
    _drawerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _drawerAnimation = CurvedAnimation(
      parent: _drawerController,
      curve: Curves.easeOutCubic,
    );
    // Initialize after first frame so the provider is ready
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatProvider.notifier).init();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _drawerController.dispose();
    super.dispose();
  }

  void _toggleHistory() {
    setState(() => _showHistory = !_showHistory);
    if (_showHistory) {
      _drawerController.forward();
    } else {
      _drawerController.reverse();
    }
  }

  void _closeHistory() {
    if (_showHistory) {
      setState(() => _showHistory = false);
      _drawerController.reverse();
    }
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
      height: MediaQuery.of(context).size.height,
      decoration: const BoxDecoration(color: AppTheme.ivoryBackground),
      child: Stack(
        children: [
          // Main chat column
          Column(
            children: [
              // Safe area spacer for status bar
              SizedBox(height: MediaQuery.of(context).padding.top),
              //  Header
              _ChatHeader(
                onClose: () => Navigator.pop(context),
                onToggleHistory: _toggleHistory,
                onNewChat: () {
                  ref.read(chatProvider.notifier).startNewConversation();
                  _closeHistory();
                },
              ),

              // Message list
              Expanded(
                child: chatState.isInitializing
                    ? const Center(
                        child: CircularProgressIndicator(
                          color: AppTheme.accentGold,
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

              //  Dynamic suggestion chips
              _DynamicChips(
                hasRecommendations: chatState.messages.any(
                  (m) =>
                      m.isAI &&
                      m.recommendations != null &&
                      m.recommendations!.isNotEmpty,
                ),
                isSending: chatState.isSending,
                onSend: (prompt) {
                  _messageController.text = prompt;
                  _sendMessage();
                },
              ),

              //  Input
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
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
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.ivoryBackground,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: AppTheme.softTaupe,
                              width: 1,
                            ),
                          ),
                          child: TextField(
                            controller: _messageController,
                            minLines: 1,
                            maxLines: 3,
                            decoration: InputDecoration(
                              hintText: 'Mô tả buổi hẹn của bạn...',
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(
                                vertical: 8,
                              ),
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
                      ),
                      const SizedBox(width: 10),
                      GestureDetector(
                        onTap: (chatState.isSending || chatState.isInitializing)
                            ? null
                            : _sendMessage,
                        child: Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: chatState.isSending
                                ? AppTheme.mutedSilver
                                : AppTheme.accentGold,
                            shape: BoxShape.circle,
                            boxShadow: chatState.isSending
                                ? null
                                : [
                                    BoxShadow(
                                      color: AppTheme.accentGold.withValues(
                                        alpha: 0.3,
                                      ),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
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
                                  size: 26,
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Scrim overlay when drawer is open
          if (_showHistory)
            AnimatedBuilder(
              animation: _drawerAnimation,
              builder: (context, child) => GestureDetector(
                onTap: _closeHistory,
                child: Container(
                  color: Colors.black.withValues(
                    alpha: 0.3 * _drawerAnimation.value,
                  ),
                ),
              ),
            ),

          // Side drawer
          AnimatedBuilder(
            animation: _drawerAnimation,
            builder: (context, child) {
              final drawerWidth = MediaQuery.of(context).size.width * 0.78;
              return Positioned(
                left: -drawerWidth + (drawerWidth * _drawerAnimation.value),
                top: 0,
                bottom: 0,
                width: drawerWidth,
                child: _ConversationDrawer(
                  conversations: chatState.conversations,
                  activeId: chatState.activeConversationId,
                  onSelect: (id) {
                    ref.read(chatProvider.notifier).selectConversation(id);
                    _closeHistory();
                  },
                  onDelete: (id) {
                    ref.read(chatProvider.notifier).deleteConversation(id);
                  },
                  onNewChat: () {
                    ref.read(chatProvider.notifier).startNewConversation();
                    _closeHistory();
                  },
                  onClose: _closeHistory,
                ),
              );
            },
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
  final VoidCallback onToggleHistory;
  final VoidCallback onNewChat;
  const _ChatHeader({
    required this.onClose,
    required this.onToggleHistory,
    required this.onNewChat,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        border: Border(bottom: BorderSide(color: AppTheme.softTaupe, width: 1)),
      ),
      child: Row(
        children: [
          // Menu button to toggle conversation history
          GestureDetector(
            onTap: onToggleHistory,
            child: const Icon(
              Icons.menu_rounded,
              color: AppTheme.deepCharcoal,
              size: 22,
            ),
          ),
          const SizedBox(width: 10),
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppTheme.accentGold,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: AppTheme.primaryDb,
              size: 18,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chuyên gia mùi hương',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'ĐANG HOẠT ĐỘNG',
                      style: GoogleFonts.montserrat(
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.8,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // New chat button
          GestureDetector(
            onTap: onNewChat,
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.add_rounded,
                color: AppTheme.accentGold,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.close, color: AppTheme.deepCharcoal),
            onPressed: onClose,
          ),
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Text(
                '✦',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.accentGold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.creamWhite,
              borderRadius: const BorderRadius.only(
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
              border: Border.all(color: AppTheme.softTaupe),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Đang suy nghĩ',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: AppTheme.mutedSilver,
                  ),
                ),
                const SizedBox(width: 6),
                ...List.generate(3, (i) {
                  return AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final delay = i * 0.2;
                      final t = (_controller.value - delay).clamp(0.0, 1.0);
                      final bounce = (t < 0.5) ? (t * 2) : (2 - t * 2);
                      return Padding(
                        padding: const EdgeInsets.only(left: 2),
                        child: Transform.translate(
                          offset: Offset(0, -3 * bounce),
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: AppTheme.accentGold.withValues(
                                alpha: 0.4 + 0.6 * bounce,
                              ),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      );
                    },
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Dynamic Suggestion Chips
// ---------------------------------------------------------------------------

class _DynamicChips extends StatelessWidget {
  final bool hasRecommendations;
  final bool isSending;
  final void Function(String prompt) onSend;

  const _DynamicChips({
    required this.hasRecommendations,
    required this.isSending,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    final chips = hasRecommendations ? _contextChips : _defaultChips;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: chips.map((c) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: isSending ? null : () => onSend(c.prompt),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.creamWhite,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppTheme.accentGold.withValues(alpha: 0.5),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(c.icon, size: 16, color: AppTheme.accentGold),
                      const SizedBox(width: 6),
                      Text(
                        c.label,
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  static const _defaultChips = [
    _ChipData(
      Icons.casino_outlined,
      'Gợi ý bất ngờ',
      'Gợi ý cho tôi một mùi hương bất ngờ',
    ),
    _ChipData(
      Icons.attach_money,
      'Dưới 1 triệu',
      'Gợi ý nước hoa dưới 1 triệu đồng',
    ),
    _ChipData(
      Icons.nightlight_outlined,
      'Hương cho buổi tối',
      'Mùi hương phù hợp cho buổi tối',
    ),
    _ChipData(Icons.favorite_border, 'Quà tặng', 'Gợi ý nước hoa làm quà tặng'),
  ];

  static const _contextChips = [
    _ChipData(Icons.trending_down, 'Rẻ hơn', 'Gợi ý tương tự nhưng rẻ hơn'),
    _ChipData(Icons.spa_outlined, 'Ngọt hơn', 'Gợi ý mùi hương ngọt hơn'),
    _ChipData(Icons.work_outline, 'Đi làm', 'Gợi ý nước hoa phù hợp đi làm'),
    _ChipData(Icons.male, 'Nam tính hơn', 'Gợi ý nước hoa nam tính hơn'),
    _ChipData(Icons.female, 'Nữ tính hơn', 'Gợi ý nước hoa nữ tính hơn'),
  ];
}

class _ChipData {
  final IconData icon;
  final String label;
  final String prompt;
  const _ChipData(this.icon, this.label, this.prompt);
}

// ---------------------------------------------------------------------------
// Conversation Drawer (vertical side panel)
// ---------------------------------------------------------------------------

class _ConversationDrawer extends StatelessWidget {
  final List<ConversationSummary> conversations;
  final String? activeId;
  final void Function(String id) onSelect;
  final void Function(String id) onDelete;
  final VoidCallback onNewChat;
  final VoidCallback onClose;

  const _ConversationDrawer({
    required this.conversations,
    required this.activeId,
    required this.onSelect,
    required this.onDelete,
    required this.onNewChat,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 8,
      child: Container(
        color: AppTheme.creamWhite,
        child: SafeArea(
          child: Column(
            children: [
              // Drawer header
              Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppTheme.softTaupe, width: 1),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppTheme.accentGold,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.auto_awesome_rounded,
                        color: AppTheme.primaryDb,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Lịch sử chat',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.close,
                        color: AppTheme.deepCharcoal,
                        size: 22,
                      ),
                      onPressed: onClose,
                    ),
                  ],
                ),
              ),

              // New chat button
              GestureDetector(
                onTap: onNewChat,
                child: Container(
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.accentGold.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.add_rounded,
                        size: 20,
                        color: AppTheme.accentGold,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Cuộc trò chuyện mới',
                        style: GoogleFonts.montserrat(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.accentGold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Section label
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'GẦN ĐÂY',
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.5,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                ),
              ),

              // Conversation list
              if (conversations.isEmpty)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline_rounded,
                          size: 48,
                          color: AppTheme.mutedSilver.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Chưa có cuộc trò chuyện nào',
                          style: GoogleFonts.montserrat(
                            fontSize: 13,
                            color: AppTheme.mutedSilver,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.only(bottom: 16),
                    itemCount: conversations.length,
                    itemBuilder: (context, index) {
                      final conv = conversations[index];
                      final isActive = conv.id == activeId;
                      final dateStr = DateFormat(
                        'dd/MM HH:mm',
                      ).format(conv.updatedAt);
                      final preview = conv.lastMessageText.isNotEmpty
                          ? (conv.lastMessageText.length > 40
                                ? '${conv.lastMessageText.substring(0, 40)}...'
                                : conv.lastMessageText)
                          : 'Không có tin nhắn';

                      return Dismissible(
                        key: ValueKey(conv.id),
                        direction: DismissDirection.endToStart,
                        confirmDismiss: (direction) async {
                          return await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: Text(
                                    'Xóa cuộc trò chuyện',
                                    style: GoogleFonts.playfairDisplay(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  content: Text(
                                    'Bạn có chắc muốn xóa đoạn chat này không?',
                                    style: GoogleFonts.montserrat(fontSize: 14),
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.of(ctx).pop(false),
                                      child: Text(
                                        'Hủy',
                                        style: GoogleFonts.montserrat(
                                          color: AppTheme.mutedSilver,
                                        ),
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.of(ctx).pop(true),
                                      child: Text(
                                        'Xóa',
                                        style: GoogleFonts.montserrat(
                                          color: const Color(0xFFFF453A),
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ) ??
                              false;
                        },
                        onDismissed: (_) => onDelete(conv.id),
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          margin: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFFFF453A,
                            ).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.delete_outline_rounded,
                            color: Color(0xFFFF453A),
                            size: 22,
                          ),
                        ),
                        child: GestureDetector(
                          onTap: () => onSelect(conv.id),
                          child: Container(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 3,
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? AppTheme.accentGold.withValues(alpha: 0.1)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                              border: isActive
                                  ? Border.all(
                                      color: AppTheme.accentGold.withValues(
                                        alpha: 0.3,
                                      ),
                                    )
                                  : null,
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isActive
                                        ? AppTheme.accentGold.withValues(
                                            alpha: 0.15,
                                          )
                                        : AppTheme.ivoryBackground,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    Icons.chat_bubble_outline_rounded,
                                    size: 16,
                                    color: isActive
                                        ? AppTheme.accentGold
                                        : AppTheme.mutedSilver,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        preview,
                                        style: GoogleFonts.montserrat(
                                          fontSize: 13,
                                          fontWeight: isActive
                                              ? FontWeight.w600
                                              : FontWeight.w400,
                                          color: AppTheme.deepCharcoal,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        dateStr,
                                        style: GoogleFonts.montserrat(
                                          fontSize: 11,
                                          color: AppTheme.mutedSilver,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
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
