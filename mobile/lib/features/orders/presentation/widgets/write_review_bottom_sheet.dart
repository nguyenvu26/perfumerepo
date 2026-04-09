import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/app_theme.dart';
import '../../models/order.dart';
import '../../models/order_item.dart';
import '../../../product/providers/review_provider.dart';

/// Bottom sheet that lets the user write a review for each item in an order.
/// Shows star rating, text input, image picker, and submit.
class WriteReviewBottomSheet extends ConsumerStatefulWidget {
  final Order order;

  const WriteReviewBottomSheet({super.key, required this.order});

  /// Convenience method to show the bottom sheet.
  static Future<bool?> show(BuildContext context, Order order) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => WriteReviewBottomSheet(order: order),
    );
  }

  @override
  ConsumerState<WriteReviewBottomSheet> createState() =>
      _WriteReviewBottomSheetState();
}

class _WriteReviewBottomSheetState
    extends ConsumerState<WriteReviewBottomSheet> {
  late List<OrderItem> _reviewableItems;
  int _currentIndex = 0;

  // Per-item state
  late List<int> _ratings;
  late List<TextEditingController> _controllers;
  late List<List<XFile>> _selectedImages;

  bool _submitting = false;
  String? _error;

  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _reviewableItems = widget.order.items;
    _ratings = List.filled(_reviewableItems.length, 5);
    _controllers = List.generate(
      _reviewableItems.length,
      (_) => TextEditingController(),
    );
    _selectedImages = List.generate(_reviewableItems.length, (_) => <XFile>[]);
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  OrderItem get _currentItem => _reviewableItems[_currentIndex];

  Future<void> _pickImages() async {
    final images = await _picker.pickMultiImage(
      imageQuality: 80,
      maxWidth: 1200,
    );
    if (images.isNotEmpty) {
      setState(() {
        final current = _selectedImages[_currentIndex];
        current.addAll(images);
        if (current.length > 5) {
          _selectedImages[_currentIndex] = current.sublist(0, 5);
        }
      });
    }
  }

  void _removeImage(int imageIdx) {
    setState(() {
      _selectedImages[_currentIndex].removeAt(imageIdx);
    });
  }

  Future<void> _submit() async {
    if (_ratings[_currentIndex] == 0) {
      setState(() => _error = 'Vui lòng chọn số sao');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final service = ref.read(reviewApiServiceProvider);
      final item = _currentItem;
      final images = _selectedImages[_currentIndex];

      // Upload images first if any
      List<String>? imageUrls;
      if (images.isNotEmpty) {
        imageUrls = await service.uploadImages(
          images.map((f) => f.path).toList(),
        );
      }

      // Create review
      await service.createReview(
        productId: item.productId,
        orderItemId: item.id,
        rating: _ratings[_currentIndex],
        content: _controllers[_currentIndex].text,
        images: imageUrls,
      );

      if (!mounted) return;

      // Move to next item or close
      if (_currentIndex < _reviewableItems.length - 1) {
        setState(() {
          _currentIndex++;
          _submitting = false;
        });
      } else {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cảm ơn bạn đã đánh giá!'),
            backgroundColor: AppTheme.accentGold,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString();
      setState(() {
        _submitting = false;
        _error = msg.contains('already reviewed')
            ? 'Bạn đã đánh giá sản phẩm này rồi'
            : 'Có lỗi xảy ra, vui lòng thử lại';
      });

      // If already reviewed, auto-skip to next
      if (msg.contains('already reviewed')) {
        await Future.delayed(const Duration(seconds: 1));
        if (!mounted) return;
        if (_currentIndex < _reviewableItems.length - 1) {
          setState(() {
            _currentIndex++;
            _error = null;
          });
        } else {
          Navigator.of(context).pop(true);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle bar
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.softTaupe,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),
                // Title
                Text(
                  'Đánh giá sản phẩm',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.deepCharcoal,
                  ),
                ),
                if (_reviewableItems.length > 1) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Sản phẩm ${_currentIndex + 1}/${_reviewableItems.length}',
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      color: AppTheme.mutedSilver,
                    ),
                  ),
                ],
                const SizedBox(height: 20),

                // Product info
                _buildProductInfo(),
                const SizedBox(height: 20),

                // Star rating
                _buildStarRating(),
                const SizedBox(height: 20),

                // Text input
                _buildTextInput(),
                const SizedBox(height: 16),

                // Image picker
                _buildImageSection(),
                const SizedBox(height: 20),

                // Error
                if (_error != null) ...[
                  Text(
                    _error!,
                    style: GoogleFonts.montserrat(
                      fontSize: 13,
                      color: Colors.red.shade600,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Submit button
                _buildSubmitButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductInfo() {
    return Row(
      children: [
        // Product image
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppTheme.accentGold.withValues(alpha: 0.3),
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: _currentItem.productImage.isEmpty
                ? const Icon(
                    Icons.inventory_2_outlined,
                    size: 28,
                    color: AppTheme.softTaupe,
                  )
                : Image.network(
                    _currentItem.productImage,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.inventory_2_outlined,
                      size: 28,
                      color: AppTheme.softTaupe,
                    ),
                  ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _currentItem.productName,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              if (_currentItem.variantLabel.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  _currentItem.variantLabel,
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStarRating() {
    return Column(
      children: [
        Text(
          _ratingLabel(_ratings[_currentIndex]),
          style: GoogleFonts.montserrat(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppTheme.accentGold,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (i) {
            final starIndex = i + 1;
            final isSelected = starIndex <= _ratings[_currentIndex];
            return GestureDetector(
              onTap: () => setState(() => _ratings[_currentIndex] = starIndex),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: AnimatedScale(
                  scale: isSelected ? 1.15 : 1.0,
                  duration: const Duration(milliseconds: 150),
                  child: Icon(
                    isSelected
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    size: 40,
                    color: isSelected
                        ? AppTheme.accentGold
                        : AppTheme.softTaupe,
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildTextInput() {
    return TextField(
      controller: _controllers[_currentIndex],
      maxLines: 4,
      maxLength: 1000,
      style: GoogleFonts.montserrat(fontSize: 14),
      decoration: InputDecoration(
        hintText: 'Chia sẻ trải nghiệm của bạn về sản phẩm...',
        hintStyle: GoogleFonts.montserrat(
          fontSize: 14,
          color: AppTheme.mutedSilver,
        ),
        filled: true,
        fillColor: AppTheme.ivoryBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.softTaupe),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.softTaupe),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.accentGold, width: 1.5),
        ),
        contentPadding: const EdgeInsets.all(14),
      ),
    );
  }

  Widget _buildImageSection() {
    final images = _selectedImages[_currentIndex];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              Icons.camera_alt_outlined,
              size: 18,
              color: AppTheme.mutedSilver,
            ),
            const SizedBox(width: 6),
            Text(
              'Thêm hình ảnh (${images.length}/5)',
              style: GoogleFonts.montserrat(
                fontSize: 13,
                color: AppTheme.mutedSilver,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 80,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              if (images.length < 5)
                GestureDetector(
                  onTap: _pickImages,
                  child: Container(
                    width: 80,
                    height: 80,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppTheme.accentGold.withValues(alpha: 0.4),
                        style: BorderStyle.solid,
                      ),
                      color: AppTheme.ivoryBackground,
                    ),
                    child: const Icon(
                      Icons.add_photo_alternate_outlined,
                      size: 28,
                      color: AppTheme.accentGold,
                    ),
                  ),
                ),
              ...images.asMap().entries.map((entry) {
                return Stack(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.softTaupe),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.file(
                          File(entry.value.path),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 2,
                      right: 10,
                      child: GestureDetector(
                        onTap: () => _removeImage(entry.key),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    final isLast = _currentIndex >= _reviewableItems.length - 1;
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: _submitting ? null : _submit,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.accentGold,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: _submitting
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Text(
                isLast ? 'Gửi đánh giá' : 'Tiếp theo',
                style: GoogleFonts.montserrat(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  String _ratingLabel(int rating) {
    switch (rating) {
      case 1:
        return 'Rất tệ';
      case 2:
        return 'Tệ';
      case 3:
        return 'Bình thường';
      case 4:
        return 'Tốt';
      case 5:
        return 'Tuyệt vời';
      default:
        return 'Chọn số sao';
    }
  }
}
