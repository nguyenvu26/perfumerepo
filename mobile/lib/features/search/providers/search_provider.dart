import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../product/data/product_repository.dart';
import '../../product/models/product.dart';

class SearchState {
  final String query;
  final int? categoryId;
  final List<Product> results;
  final bool isLoading;
  final String? error;

  const SearchState({
    this.query = '',
    this.categoryId,
    this.results = const [],
    this.isLoading = false,
    this.error,
  });

  SearchState copyWith({
    String? query,
    int? categoryId,
    bool clearCategory = false,
    List<Product>? results,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return SearchState(
      query: query ?? this.query,
      categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
      results: results ?? this.results,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class SearchNotifier extends StateNotifier<SearchState> {
  final ProductRepository _repository;

  SearchNotifier(this._repository) : super(const SearchState());

  Future<void> search(String query) async {
    state = state.copyWith(query: query, isLoading: true, clearError: true);
    try {
      final results = await _repository.getProducts(
        search: query.isEmpty ? null : query,
        categoryId: state.categoryId,
        take: 50,
      );
      state = state.copyWith(results: results, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Không thể tìm kiếm. Vui lòng thử lại.',
      );
    }
  }

  Future<void> loadInitial() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final results = await _repository.getProducts(take: 20);
      state = state.copyWith(results: results, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Không thể tải sản phẩm.',
      );
    }
  }

  void setCategory(int? categoryId) {
    if (categoryId == state.categoryId) {
      state = state.copyWith(clearCategory: true);
    } else {
      state = state.copyWith(categoryId: categoryId);
    }
    search(state.query);
  }

  void clearFilters() {
    state = SearchState(query: state.query, results: state.results);
    search(state.query);
  }
}

final searchProvider = StateNotifierProvider<SearchNotifier, SearchState>((
  ref,
) {
  final repository = ref.watch(productRepositoryProvider);
  return SearchNotifier(repository);
});

final recentSearchesProvider =
    StateNotifierProvider<RecentSearchesNotifier, List<String>>((ref) {
      return RecentSearchesNotifier();
    });

class RecentSearchesNotifier extends StateNotifier<List<String>> {
  RecentSearchesNotifier() : super([]);

  void add(String query) {
    if (query.isEmpty) return;
    if (!state.contains(query)) {
      state = [query, ...state].take(5).toList();
    }
  }

  void remove(String query) {
    state = state.where((q) => q != query).toList();
  }

  void clear() {
    state = [];
  }
}
