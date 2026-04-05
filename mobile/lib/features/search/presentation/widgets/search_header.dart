import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';

class SearchHeader extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;
  final VoidCallback onBack;
  final bool showClearButton;

  const SearchHeader({
    super.key,
    required this.controller,
    required this.onChanged,
    required this.onClear,
    required this.onBack,
    required this.showClearButton,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      color: AppTheme.creamWhite,
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: AppTheme.deepCharcoal),
            onPressed: onBack,
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.ivoryBackground,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.softTaupe, width: 1),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.search,
                    color: AppTheme.mutedSilver,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      autofocus: true,
                      decoration: InputDecoration(
                        hintText: 'gỗ ấm',
                        border: InputBorder.none,
                        hintStyle: GoogleFonts.montserrat(
                          fontSize: 16,
                          fontWeight: FontWeight.w400,
                          color: AppTheme.mutedSilver,
                        ),
                      ),
                      style: GoogleFonts.montserrat(
                        fontSize: 16,
                        color: AppTheme.deepCharcoal,
                      ),
                      onChanged: onChanged,
                    ),
                  ),
                  if (showClearButton)
                    GestureDetector(
                      onTap: onClear,
                      child: const Icon(
                        Icons.close,
                        color: AppTheme.mutedSilver,
                        size: 20,
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
