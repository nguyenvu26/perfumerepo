/// Formats a price as Vietnamese Dong (đ).
/// Example: 1200000 → '1.200.000đ'
String formatVND(double amount) {
  final intAmount = amount.round();
  final formatted = intAmount.toString().replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (match) => '${match[1]}.',
  );
  return '$formattedđ';
}
