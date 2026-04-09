import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';

class ScentStructureDetailScreen extends StatelessWidget {
  final String productName;
  final List<String>? notes;
  final List<String>? topNotes;
  final List<String>? heartNotes;
  final List<String>? baseNotes;

  const ScentStructureDetailScreen({
    super.key,
    required this.productName,
    this.notes,
    required this.topNotes,
    required this.heartNotes,
    required this.baseNotes,
  });

  @override
  Widget build(BuildContext context) {
    final safeNotes = notes ?? const <String>[];
    var safeTopNotes = topNotes ?? const <String>[];
    var safeHeartNotes = heartNotes ?? const <String>[];
    var safeBaseNotes = baseNotes ?? const <String>[];

    if (safeTopNotes.isEmpty &&
        safeHeartNotes.isEmpty &&
        safeBaseNotes.isEmpty) {
      if (safeNotes.length == 1) {
        safeTopNotes = [safeNotes.first];
      } else if (safeNotes.length == 2) {
        safeTopNotes = [safeNotes[0]];
        safeHeartNotes = [safeNotes[1]];
      } else if (safeNotes.length > 2) {
        final topEnd = (safeNotes.length / 3).ceil();
        final heartEnd = ((safeNotes.length * 2) / 3).ceil();
        safeTopNotes = safeNotes.sublist(0, topEnd);
        safeHeartNotes = safeNotes.sublist(topEnd, heartEnd);
        safeBaseNotes = safeNotes.sublist(heartEnd);
      }
    }

    final totalNotes =
        safeTopNotes.length + safeHeartNotes.length + safeBaseNotes.length;

    final summaryCard = Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.creamWhite,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.softTaupe),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            productName,
            style: GoogleFonts.playfairDisplay(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '$totalNotes note hương được sắp xếp theo 3 tầng để bạn cảm nhận rõ quá trình chuyển mùi.',
            style: GoogleFonts.montserrat(
              fontSize: 12,
              height: 1.6,
              color: AppTheme.mutedSilver,
            ),
          ),
        ],
      ),
    );

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        backgroundColor: AppTheme.ivoryBackground,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.deepCharcoal),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Cấu trúc mùi hương',
          style: GoogleFonts.playfairDisplay(
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: AppTheme.deepCharcoal,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 28),
        children: [
          summaryCard,
          const SizedBox(height: 14),
          _ScentLayerDetailCard(
            title: 'Top Notes',
            subtitle: 'Mở đầu',
            description:
                'Ấn tượng đầu tiên khi vừa xịt, thường tươi và bay nhanh.',
            notes: safeTopNotes,
            icon: Icons.auto_awesome,
            accent: AppTheme.accentGold,
          ),
          const SizedBox(height: 12),
          _ScentLayerDetailCard(
            title: 'Heart Notes',
            subtitle: 'Trái tim mùi hương',
            description: 'Phần mùi chính định hình cá tính của chai nước hoa.',
            notes: safeHeartNotes,
            icon: Icons.local_florist,
            accent: const Color(0xFFB9824A),
          ),
          const SizedBox(height: 12),
          _ScentLayerDetailCard(
            title: 'Base Notes',
            subtitle: 'Nền hương',
            description:
                'Tầng lưu hương bền nhất, tạo chiều sâu và dấu ấn cuối.',
            notes: safeBaseNotes,
            icon: Icons.grain,
            accent: const Color(0xFF7E8F7A),
          ),
        ],
      ),
    );
  }
}

class _ScentLayerDetailCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String description;
  final List<String> notes;
  final IconData icon;
  final Color accent;

  const _ScentLayerDetailCard({
    required this.title,
    required this.subtitle,
    required this.description,
    required this.notes,
    required this.icon,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppTheme.softTaupe),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: accent, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepCharcoal,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.montserrat(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: accent,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '${notes.length}',
                style: GoogleFonts.montserrat(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: GoogleFonts.montserrat(
              fontSize: 12,
              height: 1.55,
              color: AppTheme.mutedSilver,
            ),
          ),
          const SizedBox(height: 12),
          if (notes.isEmpty)
            Text(
              'Chưa có dữ liệu note cho tầng này.',
              style: GoogleFonts.montserrat(
                fontSize: 12,
                color: AppTheme.mutedSilver,
              ),
            )
          else ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: notes
                  .map(
                    (note) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 11,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        note,
                        style: GoogleFonts.montserrat(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.deepCharcoal,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 10),
            Text(
              notes.join(', ').toUpperCase(),
              style: GoogleFonts.montserrat(
                fontSize: 11,
                height: 1.45,
                letterSpacing: 0.4,
                color: accent,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
