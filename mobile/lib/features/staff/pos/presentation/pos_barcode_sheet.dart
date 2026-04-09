import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';

/// Bottom sheet: live camera scan + optional manual barcode entry.
/// Pops with the barcode string, or `null` if closed without submitting.
Future<String?> showPosBarcodeSheet(BuildContext context) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
    ),
    builder: (ctx) => const _PosBarcodeSheetBody(),
  );
}

class _PosBarcodeSheetBody extends StatefulWidget {
  const _PosBarcodeSheetBody();

  @override
  State<_PosBarcodeSheetBody> createState() => _PosBarcodeSheetBodyState();
}

class _PosBarcodeSheetBodyState extends State<_PosBarcodeSheetBody> {
  final _manual = TextEditingController();
  final MobileScannerController _camera = MobileScannerController();
  bool _handled = false;

  @override
  void dispose() {
    _manual.dispose();
    _camera.dispose();
    super.dispose();
  }

  void _finish(String raw) {
    if (_handled) return;
    final v = raw.trim();
    if (v.isEmpty) return;
    _handled = true;
    Navigator.of(context).pop(v);
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.md,
            AppSpacing.md,
            AppSpacing.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Quét mã vạch',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              AppSpacing.vertSm,
              Text(
                'Hướng camera vào mã vạch, hoặc nhập mã thủ công bên dưới.',
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  color: AppTheme.mutedSilver,
                ),
              ),
              AppSpacing.vertMd,
              ClipRRect(
                borderRadius: AppRadius.cardBorder,
                child: AspectRatio(
                  aspectRatio: 4 / 3,
                  child: MobileScanner(
                    controller: _camera,
                    onDetect: (capture) {
                      for (final b in capture.barcodes) {
                        final raw = b.rawValue;
                        if (raw != null && raw.isNotEmpty) {
                          _finish(raw);
                          return;
                        }
                      }
                    },
                  ),
                ),
              ),
              AppSpacing.vertMd,
              TextField(
                controller: _manual,
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: 'Nhập mã vạch',
                  hintText: 'VD: 8934563123456',
                  border: OutlineInputBorder(
                    borderRadius: AppRadius.inputBorder,
                  ),
                  prefixIcon: const Icon(Icons.keyboard_rounded),
                ),
                style: GoogleFonts.montserrat(fontSize: 14),
                onSubmitted: _finish,
              ),
              AppSpacing.vertMd,
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Đóng'),
                    ),
                  ),
                  AppSpacing.horzSm,
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _finish(_manual.text),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentGold,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Tìm & thêm'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
