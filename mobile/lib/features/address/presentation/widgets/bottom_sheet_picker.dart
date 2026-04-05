import 'package:flutter/material.dart';

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
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
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
            padding: const EdgeInsets.fromLTRB(16, 10, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          if (widget.enabledSearch)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onChanged: (value) => setState(() => _query = value),
              ),
            ),
          Expanded(
            child: ListView.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final item = filtered[index];
                final isSelected = item.value == widget.selected;
                return ListTile(
                  title: Text(item.label),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle, color: Colors.amber)
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
