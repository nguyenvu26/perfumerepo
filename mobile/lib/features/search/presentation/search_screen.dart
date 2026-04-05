import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/product_card.dart';
import '../../product/models/product.dart';
import '../providers/search_provider.dart';
import 'widgets/search_header.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();

  // Client-side filter state (scent/occasion/price are UI-only filters)
  String? _selectedScent;
  String? _selectedOccasion;
  String? _selectedPrice;

  static const _scentOptions = ['Woody', 'Floral', 'Fresh', 'Sweet', 'Spicy'];
  static const _occasionOptions = ['Daily', 'Office', 'Date', 'Party'];
  static const _priceOptions = ['<1M', '1-3M', '>3M'];

  bool get _hasActiveFilters =>
      _selectedScent != null ||
      _selectedOccasion != null ||
      _selectedPrice != null;

  @override
  void initState() {
    super.initState();
    // Load initial products through the provider
    Future.microtask(() => ref.read(searchProvider.notifier).loadInitial());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Product> _applyClientFilters(List<Product> products) {
    return products.where((p) {
      if (_selectedScent != null && !_matchesScent(p, _selectedScent!)) {
        return false;
      }
      if (_selectedOccasion != null &&
          !_matchesOccasion(p, _selectedOccasion!)) {
        return false;
      }
      if (_selectedPrice != null && !_matchesPrice(p, _selectedPrice!)) {
        return false;
      }
      return true;
    }).toList();
  }

  bool _matchesScent(Product p, String scent) {
    final allNotes = [
      ...p.notes,
      ...p.topNotes,
      ...p.heartNotes,
      ...p.baseNotes,
    ].map((n) => n.toLowerCase());
    final desc = (p.description ?? '').toLowerCase();
    switch (scent) {
      case 'Woody':
        return allNotes.any(
              (n) => [
                'sandalwood',
                'cedar',
                'wood',
                'oud',
                'vetiver',
                'patchouli',
              ].any((k) => n.contains(k)),
            ) ||
            desc.contains('wood') ||
            desc.contains('cedar');
      case 'Floral':
        return allNotes.any(
          (n) => [
            'rose',
            'jasmine',
            'lily',
            'iris',
            'peony',
            'violet',
            'floral',
          ].any((k) => n.contains(k)),
        );
      case 'Fresh':
        return allNotes.any(
          (n) => [
            'bergamot',
            'lemon',
            'fresh',
            'citrus',
            'green',
            'mint',
            'aqua',
          ].any((k) => n.contains(k)),
        );
      case 'Sweet':
        return allNotes.any(
          (n) => [
            'vanilla',
            'sweet',
            'caramel',
            'honey',
            'amber',
            'musk',
          ].any((k) => n.contains(k)),
        );
      case 'Spicy':
        return allNotes.any(
          (n) => [
            'pepper',
            'spice',
            'cardamom',
            'ginger',
            'clove',
            'cinnamon',
          ].any((k) => n.contains(k)),
        );
      default:
        return true;
    }
  }

  bool _matchesOccasion(Product p, String occasion) {
    final text = '${p.name} ${p.description ?? ''} ${p.notes.join(' ')}'
        .toLowerCase();
    switch (occasion) {
      case 'Daily':
        return text.contains('fresh') ||
            text.contains('light') ||
            text.contains('green');
      case 'Office':
        return text.contains('clean') ||
            text.contains('iris') ||
            text.contains('subtle');
      case 'Date':
        return text.contains('rose') ||
            text.contains('jasmine') ||
            text.contains('sensual');
      case 'Party':
        return text.contains('bold') ||
            text.contains('oud') ||
            text.contains('intense');
      default:
        return true;
    }
  }

  bool _matchesPrice(Product p, String priceRange) {
    switch (priceRange) {
      case '<1M':
        return p.price < 1000000;
      case '1-3M':
        return p.price >= 1000000 && p.price <= 3000000;
      case '>3M':
        return p.price > 3000000;
      default:
        return true;
    }
  }

  void _clearFilters() => setState(() {
    _selectedScent = null;
    _selectedOccasion = null;
    _selectedPrice = null;
  });

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchProvider);
    final filteredResults = _applyClientFilters(searchState.results);

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Header
            SearchHeader(
              controller: _searchController,
              onChanged: (value) {
                if (value.isNotEmpty) {
                  ref.read(searchProvider.notifier).search(value);
                } else {
                  ref.read(searchProvider.notifier).loadInitial();
                }
              },
              onClear: () {
                _searchController.clear();
                ref.read(searchProvider.notifier).loadInitial();
              },
              onBack: () => Navigator.pop(context),
              showClearButton: _searchController.text.isNotEmpty,
            ),

            // Results title
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      _searchController.text.isEmpty
                          ? 'Huong thom noi bat'
                          : 'Ket qua cho "${_searchController.text}"',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                  ),
                  if (!searchState.isLoading)
                    Text(
                      '${filteredResults.length} san pham',
                      style: GoogleFonts.montserrat(
                        fontSize: 11,
                        color: AppTheme.mutedSilver,
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Filter row - Scent
            _FilterChipRow(
              options: _scentOptions,
              selected: _selectedScent,
              onSelect: (v) => setState(
                () => _selectedScent = _selectedScent == v ? null : v,
              ),
            ),
            const SizedBox(height: 6),

            // Filter row - Occasion
            _FilterChipRow(
              options: _occasionOptions,
              selected: _selectedOccasion,
              onSelect: (v) => setState(
                () => _selectedOccasion = _selectedOccasion == v ? null : v,
              ),
            ),
            const SizedBox(height: 6),

            // Filter row - Price
            _FilterChipRow(
              options: _priceOptions,
              selected: _selectedPrice,
              onSelect: (v) => setState(
                () => _selectedPrice = _selectedPrice == v ? null : v,
              ),
            ),

            // Active filter summary
            if (_hasActiveFilters)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${filteredResults.length} ket qua phu hop',
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          color: AppTheme.mutedSilver,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: _clearFilters,
                      child: Text(
                        'Xoa bo loc',
                        style: GoogleFonts.montserrat(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.accentGold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 12),

            // Results
            Expanded(
              child: searchState.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppTheme.accentGold,
                      ),
                    )
                  : searchState.error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.error_outline,
                            size: 48,
                            color: AppTheme.mutedSilver,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            searchState.error!,
                            style: GoogleFonts.montserrat(
                              fontSize: 13,
                              color: AppTheme.mutedSilver,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextButton(
                            onPressed: () =>
                                ref.read(searchProvider.notifier).loadInitial(),
                            child: const Text('Thu lai'),
                          ),
                        ],
                      ),
                    )
                  : filteredResults.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.search_off_rounded,
                            size: 64,
                            color: AppTheme.mutedSilver.withValues(alpha: 0.4),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Khong tim thay san pham phu hop',
                            style: GoogleFonts.montserrat(
                              fontSize: 14,
                              color: AppTheme.mutedSilver,
                            ),
                          ),
                          if (_hasActiveFilters) ...[
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: _clearFilters,
                              child: Text(
                                'Xoa bo loc',
                                style: GoogleFonts.montserrat(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.accentGold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.62,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                      itemCount: filteredResults.length,
                      itemBuilder: (_, index) {
                        return ProductCard(product: filteredResults[index]);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChipRow extends StatelessWidget {
  final List<String> options;
  final String? selected;
  final ValueChanged<String> onSelect;

  const _FilterChipRow({
    required this.options,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: options.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, index) {
          final option = options[index];
          final isSelected = option == selected;
          return GestureDetector(
            onTap: () => onSelect(option),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.accentGold.withValues(alpha: 0.15)
                    : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? AppTheme.accentGold : AppTheme.softTaupe,
                ),
              ),
              child: Text(
                option,
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected
                      ? AppTheme.accentGold
                      : AppTheme.deepCharcoal,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
