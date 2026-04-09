import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';


import '../../../../core/theme/app_theme.dart';

import '../../models/order.dart';
import '../../providers/order_provider.dart';

class ReturnOrderScreen extends ConsumerStatefulWidget {
  final String orderId;

  const ReturnOrderScreen({super.key, required this.orderId});

  @override
  ConsumerState<ReturnOrderScreen> createState() => _ReturnOrderScreenState();
}

class _ReturnOrderScreenState extends ConsumerState<ReturnOrderScreen> {
  final _reasonController = TextEditingController();
  final List<File> _images = [];
  final ImagePicker _picker = ImagePicker();
  
  // variantId -> quantity
  final Map<String, int> _selectedItems = {};
  bool _isSubmitting = false;

  Future<void> _pickImages() async {
    final List<XFile> picked = await _picker.pickMultiImage(
      imageQuality: 70,
    );
    if (picked.isNotEmpty) {
      setState(() {
        for (var p in picked) {
          if (_images.length < 5) {
            _images.add(File(p.path));
          }
        }
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _images.removeAt(index);
    });
  }

  void _submitReturn() async {
    if (_selectedItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn sản phẩm cần trả')),
      );
      return;
    }
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập lý do trả hàng')),
      );
      return;
    }
    
    setState(() => _isSubmitting = true);
    
    try {
      // Stub: in reality, call returnRequestProvider or API service
      // e.g. await ref.read(returnServiceProvider).createReturn(widget.orderId, _selectedItems, _reasonController.text, _images);
      
      await Future.delayed(const Duration(seconds: 2));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Yêu cầu trả hàng đã được gửi thành công'),
            backgroundColor: Color(0xFF12B76A),
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: \${e.toString()}'),
            backgroundColor: const Color(0xFFD92D20),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(orderDetailProvider(widget.orderId));

    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Yêu cầu trả hàng',
          style: GoogleFonts.playfairDisplay(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppTheme.deepCharcoal,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
      ),
      body: orderAsync.when(
        data: (order) => _buildContent(order),
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.accentGold),
        ),
        error: (err, _) => Center(
          child: Text('Lỗi tải đơn hàng', style: TextStyle(color: Color(0xFFD92D20))),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submitReturn,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.deepCharcoal,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: _isSubmitting 
              ? const SizedBox(
                  width: 20, height: 20, 
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                )
              : Text(
                  'Gửi yêu cầu trả hàng',
                  style: GoogleFonts.montserrat(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    letterSpacing: 0.5,
                  ),
                ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(Order order) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Items to return
          Text(
            'Chọn sản phẩm cần trả',
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.mutedSilver.withValues(alpha: 0.2)),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: order.items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (ctx, index) {
                final item = order.items[index];
                final isSelected = _selectedItems.containsKey(item.variantId);
                final qty = _selectedItems[item.variantId] ?? 0;
                
                return Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Checkbox(
                        value: isSelected,
                        activeColor: AppTheme.accentGold,
                        onChanged: (val) {
                          setState(() {
                            if (val == true) {
                              _selectedItems[item.variantId] = item.quantity;
                            } else {
                              _selectedItems.remove(item.variantId);
                            }
                          });
                        },
                      ),
                      // Image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: item.productImage.isNotEmpty
                          ? Image.network(item.productImage, width: 50, height: 50, fit: BoxFit.cover)
                          : Container(width: 50, height: 50, color: Colors.grey[200]),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.productName,
                              style: TextStyle(color: AppTheme.deepCharcoal, fontWeight: FontWeight.bold, fontSize: 13),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              item.variantLabel,
                              style: TextStyle(color: AppTheme.mutedSilver, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      if (isSelected && item.quantity > 1) 
                        Row(
                          children: [
                            IconButton(
                              onPressed: () {
                                if (qty > 1) {
                                  setState(() => _selectedItems[item.variantId] = qty - 1);
                                } else {
                                  setState(() => _selectedItems.remove(item.variantId));
                                }
                              },
                              icon: const Icon(Icons.remove_circle_outline, size: 20),
                            ),
                            Text('\$qty', style: const TextStyle(fontWeight: FontWeight.bold)),
                            IconButton(
                              onPressed: () {
                                if (qty < item.quantity) {
                                  setState(() => _selectedItems[item.variantId] = qty + 1);
                                }
                              },
                              icon: const Icon(Icons.add_circle_outline, size: 20),
                            ),
                          ],
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Reason input
          Text(
            'Lý do trả hàng',
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reasonController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Mô tả chi tiết tình trạng sản phẩm...',
              hintStyle: GoogleFonts.montserrat(color: AppTheme.mutedSilver, fontSize: 13),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppTheme.mutedSilver.withValues(alpha: 0.2)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppTheme.mutedSilver.withValues(alpha: 0.2)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppTheme.accentGold),
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Images
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Hình ảnh / Video thực tế',
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepCharcoal,
                ),
              ),
              Text(
                '\${_images.length}/5',
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  color: AppTheme.mutedSilver,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              ..._images.asMap().entries.map((e) {
                final idx = e.key;
                final file = e.value;
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        file,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () => _removeImage(idx),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close, size: 14, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              }),
              if (_images.length < 5)
                GestureDetector(
                  onTap: _pickImages,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppTheme.mutedSilver.withValues(alpha: 0.3),
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo_outlined, color: AppTheme.accentGold),
                        SizedBox(height: 4),
                        Text('Thêm ảnh', style: TextStyle(fontSize: 10, color: AppTheme.mutedSilver)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
