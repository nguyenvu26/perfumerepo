import 'package:flutter_riverpod/flutter_riverpod.dart';

class CartSelectionState {
  final Set<String> selectedIds;
  final bool selectAll;

  const CartSelectionState({
    this.selectedIds = const {},
    this.selectAll = true,
  });

  CartSelectionState copyWith({Set<String>? selectedIds, bool? selectAll}) {
    return CartSelectionState(
      selectedIds: selectedIds ?? this.selectedIds,
      selectAll: selectAll ?? this.selectAll,
    );
  }
}

class CartSelectionNotifier extends StateNotifier<CartSelectionState> {
  CartSelectionNotifier() : super(const CartSelectionState());

  void initFromCart(List<String> allItemIds) {
    if (state.selectedIds.isEmpty && allItemIds.isNotEmpty) {
      state = CartSelectionState(
        selectedIds: allItemIds.toSet(),
        selectAll: true,
      );
    }
  }

  void toggle(String itemId, int totalCount) {
    final updated = Set<String>.from(state.selectedIds);
    if (updated.contains(itemId)) {
      updated.remove(itemId);
    } else {
      updated.add(itemId);
    }
    state = CartSelectionState(
      selectedIds: updated,
      selectAll: updated.length == totalCount,
    );
  }

  void toggleAll(List<String> allItemIds) {
    if (state.selectAll) {
      state = const CartSelectionState(selectedIds: {}, selectAll: false);
    } else {
      state = CartSelectionState(
        selectedIds: allItemIds.toSet(),
        selectAll: true,
      );
    }
  }

  void removeId(String itemId) {
    final updated = Set<String>.from(state.selectedIds)..remove(itemId);
    state = state.copyWith(selectedIds: updated);
  }

  void clear() {
    state = const CartSelectionState();
  }
}

final cartSelectionProvider =
    StateNotifierProvider<CartSelectionNotifier, CartSelectionState>(
      (ref) => CartSelectionNotifier(),
    );
