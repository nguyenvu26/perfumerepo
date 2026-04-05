import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_theme.dart';

class PickerItem<T> {
  final T value;
  final String label;

  const PickerItem({required this.value, required this.label});
}

Future<T?> showBottomSheetPicker<T>({
  required BuildContext context,
  required String title,
  required List<PickerItem<T>> items,
  T? selected,
  bool enabledSearch = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) {
      return _BottomSheetPicker<T>(
        title: title,
        items: items,
        selected: selected,
        enabledSearch: enabledSearch,
      );
    },
  );
}

class _BottomSheetPicker<T> extends StatefulWidget {
  final String title;
  final List<PickerItem<T>> items;
  final T? selected;
  final bool enabledSearch;

  const _BottomSheetPicker({
    required this.title,
    required this.items,
    required this.selected,
    required this.enabledSearch,
  });

  @override
  State<_BottomSheetPicker<T>> createState() => _BottomSheetPickerState<T>();
}

class _BottomSheetPickerState<T> extends State<_BottomSheetPicker<T>> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final filtered = widget.items.where((item) {
      if (_query.trim().isEmpty) return true;
      return item.label.toLowerCase().contains(_query.toLowerCase());
    }).toList();

    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.86,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title,
                    style: GoogleFonts.montserrat(
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.deepCharcoal.withValues(alpha: 0.8),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, color: AppTheme.deepCharcoal, size: 24),
                ),
              ],
            ),
          ),
          if (widget.enabledSearch)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm',
                  hintStyle: GoogleFonts.montserrat(color: AppTheme.mutedSilver),
                  prefixIcon: const Icon(Icons.search, color: AppTheme.deepCharcoal, size: 22),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppTheme.softTaupe.withValues(alpha: 0.5)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppTheme.deepCharcoal),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onChanged: (value) => setState(() => _query = value),
              ),
            ),
          Expanded(
            child: ListView.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: AppTheme.softTaupe.withValues(alpha: 0.5)),
              itemBuilder: (context, index) {
                final item = filtered[index];
                final isSelected = item.value == widget.selected;
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  title: Text(
                    item.label,
                    style: GoogleFonts.montserrat(
                      fontSize: 16,
                      fontWeight: isSelected ? FontWeight.w500 : FontWeight.w400,
                      color: AppTheme.deepCharcoal,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle, color: AppTheme.accentGold)
                      : null,
                  onTap: () => Navigator.of(context).pop(item.value),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
