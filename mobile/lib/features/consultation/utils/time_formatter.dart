class TimeFormatter {
  /// Format timestamp to relative time string
  /// Examples: "Just now", "5m ago", "2h ago", "3d ago"
  static String formatRelativeTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inHours < 1) return '${diff.inMinutes} phút trước';
    if (diff.inDays < 1) return '${diff.inHours} giờ trước';
    return '${diff.inDays} ngày trước';
  }
}
