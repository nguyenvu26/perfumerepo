import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class ScentStructureSection extends StatelessWidget {
  final List<String>? notes;
  final List<String>? topNotes;
  final List<String>? heartNotes;
  final List<String>? baseNotes;
  final VoidCallback? onViewAll;

  const ScentStructureSection({
    super.key,
    required this.notes,
    this.topNotes,
    this.heartNotes,
    this.baseNotes,
    this.onViewAll,
  });

  static const double _iconSize = 52;
  static const double _lineBottomOffset = 78;

  @override
  Widget build(BuildContext context) {
    final safeNotes = notes ?? const <String>[];
    final safeTopNotes = topNotes ?? const <String>[];
    final safeHeartNotes = heartNotes ?? const <String>[];
    final safeBaseNotes = baseNotes ?? const <String>[];

    final previewTopNotes = safeTopNotes.isNotEmpty
        ? safeTopNotes
        : (safeNotes.isNotEmpty ? [safeNotes[0]] : <String>[]);
    final previewHeartNotes = safeHeartNotes.isNotEmpty
        ? safeHeartNotes
        : (safeNotes.length > 1 ? [safeNotes[1]] : <String>[]);
    final previewBaseNotes = safeBaseNotes.isNotEmpty
        ? safeBaseNotes
        : (safeNotes.length > 2 ? safeNotes.sublist(2) : <String>[]);

    final topNote = _previewNote(previewTopNotes, 'Cam chanh');
    final heartNote = _previewNote(previewHeartNotes, 'Hoa hồng');
    final baseNote = _previewNote(previewBaseNotes, 'Gỗ đàn hương');

    final viewAllButton = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onViewAll,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'XEM TẤT CẢ',
                style: GoogleFonts.montserrat(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.9,
                  color: AppTheme.accentGold,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.arrow_forward_ios,
                size: 12,
                color: AppTheme.accentGold,
              ),
            ],
          ),
        ),
      ),
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 330;

        final content = Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 48),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isCompact)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cấu trúc mùi hương',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Align(
                      alignment: Alignment.centerRight,
                      child: viewAllButton,
                    ),
                  ],
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Cấu trúc mùi hương',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    viewAllButton,
                  ],
                ),
              SizedBox(height: isCompact ? 16 : 24),
              if (isCompact)
                Column(
                  children: [
                    _ScentLayer(
                      icon: Icons.spa_outlined,
                      label: 'HƯƠNG ĐẦU',
                      note: topNote,
                      descriptor: 'Tươi sáng và nhẹ nhàng',
                      isActive: false,
                      iconSize: _iconSize,
                      width: double.infinity,
                    ),
                    const SizedBox(height: 10),
                    _ScentLayer(
                      icon: Icons.local_florist,
                      label: 'HƯƠNG GIỮA',
                      note: heartNote,
                      descriptor: 'Đậm đà và đa tầng',
                      isActive: true,
                      iconSize: _iconSize,
                      width: double.infinity,
                    ),
                    const SizedBox(height: 10),
                    _ScentLayer(
                      icon: Icons.water_drop_outlined,
                      label: 'HƯƠNG CUỐI',
                      note: baseNote,
                      descriptor: 'Sâu lắng và bền lâu',
                      isActive: false,
                      iconSize: _iconSize,
                      width: double.infinity,
                    ),
                  ],
                )
              else
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _ScentLayer(
                        icon: Icons.spa_outlined,
                        label: 'HƯƠNG ĐẦU',
                        note: topNote,
                        descriptor: 'Tươi sáng và nhẹ nhàng',
                        isActive: false,
                        iconSize: _iconSize,
                      ),
                      Expanded(
                        child: Container(
                          margin: EdgeInsets.only(
                            top: _iconSize / 2,
                            bottom: _lineBottomOffset,
                          ),
                          height: 1.5,
                          color: AppTheme.softTaupe.withValues(alpha: 0.6),
                        ),
                      ),
                      _ScentLayer(
                        icon: Icons.local_florist,
                        label: 'HƯƠNG GIỮA',
                        note: heartNote,
                        descriptor: 'Đậm đà và đa tầng',
                        isActive: true,
                        iconSize: _iconSize,
                      ),
                      Expanded(
                        child: Container(
                          margin: EdgeInsets.only(
                            top: _iconSize / 2,
                            bottom: _lineBottomOffset,
                          ),
                          height: 1.5,
                          color: AppTheme.softTaupe.withValues(alpha: 0.6),
                        ),
                      ),
                      _ScentLayer(
                        icon: Icons.water_drop_outlined,
                        label: 'HƯƠNG CUỐI',
                        note: baseNote,
                        descriptor: 'Sâu lắng và bền lâu',
                        isActive: false,
                        iconSize: _iconSize,
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );

        if (constraints.hasBoundedHeight) {
          return SingleChildScrollView(
            physics: const NeverScrollableScrollPhysics(),
            child: content,
          );
        }

        return content;
      },
    );
  }
}

class _ScentLayer extends StatelessWidget {
  final IconData icon;
  final String label;
  final String note;
  final String descriptor;
  final bool isActive;
  final double iconSize;
  final double width;

  const _ScentLayer({
    required this.icon,
    required this.label,
    required this.note,
    required this.descriptor,
    required this.isActive,
    required this.iconSize,
    this.width = 72,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedScale(
            scale: isActive ? 1.0 : 0.95,
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOutCubic,
              width: iconSize,
              height: iconSize,
              decoration: BoxDecoration(
                color: isActive ? AppTheme.accentGold : Colors.white,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isActive ? AppTheme.accentGold : AppTheme.softTaupe,
                  width: isActive ? 0 : 1.5,
                ),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: AppTheme.accentGold.withValues(alpha: 0.35),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Icon(
                icon,
                color: isActive ? Colors.white : AppTheme.mutedSilver,
                size: isActive ? 26 : 22,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 8,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
              color: isActive ? AppTheme.accentGold : AppTheme.mutedSilver,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            note,
            style: GoogleFonts.playfairDisplay(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

String _previewNote(List<String> notes, String fallback) {
  if (notes.isEmpty) return fallback;
  if (notes.length == 1) return notes.first;
  return '${notes.first} +${notes.length - 1}';
}
