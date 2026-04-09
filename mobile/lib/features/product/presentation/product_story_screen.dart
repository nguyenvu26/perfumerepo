import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/luxury_button.dart';

class ProductStoryScreen extends StatelessWidget {
  final String productId;
  final String productName;
  final String imageUrl;

  const ProductStoryScreen({
    super.key,
    required this.productId,
    required this.productName,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.ivoryBackground,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 80,
            floating: false,
            pinned: true,
            backgroundColor: AppTheme.ivoryBackground,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: AppTheme.deepCharcoal),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              centerTitle: true,
              title: Text(
                'Câu chuyện phía sau mùi hương',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 20),
                _HeroImage(imageUrl: imageUrl),
                const SizedBox(height: 50),
                _StorySection(
                  label: 'NGUỒN CẢM HỨNG',
                  children: [
                    _DropCapParagraph(
                      text:
                          'Mọi thứ bắt đầu trong một khu vườn mưa ở Kyoto. Mùi đất ẩm quyện cùng hương hoa nhài đang nở tạo nên một khoảnh khắc tĩnh lặng tuyệt đối mà chúng tôi biết mình phải lưu giữ. Chúng tôi không chỉ muốn đóng chai một mùi hương, mà muốn cất lại sự tĩnh sâu của buổi chiều hôm ấy, khi thời gian như ngừng trôi giữa những phiến đá phủ rêu.',
                    ),
                    const SizedBox(height: 20),
                    _BodyText(
                      text:
                          'Hành trình ấy đưa chúng tôi đi qua nhiều châu lục để tìm ra tinh chất hoa nhài có thể tái hiện đúng sự tươi mát đẫm sương ấy mà không trở nên quá nồng. Đó là sự cân bằng mong manh giữa thiên nhiên và ký ức.',
                    ),
                  ],
                ),
                const SizedBox(height: 50),
                _Divider(),
                const SizedBox(height: 50),
                _StorySection(
                  label: 'NGHỆ THUẬT CHẾ TÁC',
                  children: [
                    _BodyText(
                      text:
                          'Những nhà chế tác hương bậc thầy của chúng tôi sử dụng kỹ thuật enfleurage cổ điển, một quy trình công phu hiếm khi còn được áp dụng trong ngành nước hoa hiện đại vì đòi hỏi rất nhiều thời gian và sự tỉ mỉ. Từng cánh hoa được nâng niu chiết xuất để giữ lại linh hồn của bông hoa ở trạng thái tinh khiết nhất.',
                    ),
                    const SizedBox(height: 20),
                    _BodyText(
                      text:
                          'Sự tận tâm với lối chế tác chậm rãi này bảo đảm rằng mỗi chai nước hoa đều chứa chiều sâu, độ ấm và sự phức hợp mà các hợp chất tổng hợp khó có thể tái tạo. Đó là minh chứng cho sự kiên nhẫn và khát vọng theo đuổi sự hoàn mỹ.',
                    ),
                  ],
                ),
                const SizedBox(height: 50),
                _EditorialImage(
                  imageUrl:
                      'https://images.unsplash.com/photo-1615634260167-c8cdede054de',
                  caption: 'Hoa nhài được hái thủ công lúc bình minh',
                ),
                const SizedBox(height: 50),
                _QuoteBlock(
                  quote:
                      'Nước hoa là một câu chuyện được kể bằng hương thơm, đôi khi là thi ca của ký ức.',
                  author: 'Jean-Claude Ellena',
                ),
                const SizedBox(height: 60),
                _FooterActions(productId: productId),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroImage extends StatelessWidget {
  final String imageUrl;

  const _HeroImage({required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 400,
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Image.network(
          imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            color: const Color(0xFF1A1A1A),
            child: const Center(
              child: Icon(
                Icons.image_outlined,
                size: 60,
                color: AppTheme.mutedSilver,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StorySection extends StatelessWidget {
  final String label;
  final List<Widget> children;

  const _StorySection({required this.label, required this.children});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 2,
              color: AppTheme.mutedSilver,
            ),
          ),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }
}

class _DropCapParagraph extends StatelessWidget {
  final String text;

  const _DropCapParagraph({required this.text});

  @override
  Widget build(BuildContext context) {
    final firstLetter = text.substring(0, 1);
    final restOfText = text.substring(1);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          firstLetter,
          style: GoogleFonts.playfairDisplay(
            fontSize: 72,
            fontWeight: FontWeight.w600,
            height: 0.9,
            color: AppTheme.accentGold,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              Text(
                restOfText,
                style: GoogleFonts.montserrat(
                  fontSize: 15,
                  fontWeight: FontWeight.w400,
                  height: 1.75,
                  color: AppTheme.deepCharcoal,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _BodyText extends StatelessWidget {
  final String text;

  const _BodyText({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.montserrat(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        height: 1.75,
        color: AppTheme.deepCharcoal,
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 4,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 4,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 4,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}

class _EditorialImage extends StatelessWidget {
  final String imageUrl;
  final String caption;

  const _EditorialImage({required this.imageUrl, required this.caption});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              imageUrl,
              height: 280,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                height: 280,
                color: const Color(0xFFF5F1ED),
                child: const Center(
                  child: Icon(
                    Icons.image_outlined,
                    size: 40,
                    color: AppTheme.mutedSilver,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            caption,
            style: GoogleFonts.montserrat(
              fontSize: 12,
              fontStyle: FontStyle.italic,
              color: AppTheme.mutedSilver,
            ),
          ),
        ],
      ),
    );
  }
}

class _QuoteBlock extends StatelessWidget {
  final String quote;
  final String author;

  const _QuoteBlock({required this.quote, required this.author});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        children: [
          Text(
            '"$quote"',
            textAlign: TextAlign.center,
            style: GoogleFonts.playfairDisplay(
              fontSize: 20,
              fontWeight: FontWeight.w400,
              fontStyle: FontStyle.italic,
              height: 1.6,
              color: AppTheme.deepCharcoal,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            '— $author',
            textAlign: TextAlign.center,
            style: GoogleFonts.montserrat(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              letterSpacing: 1,
              color: AppTheme.accentGold,
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterActions extends StatelessWidget {
  final String productId;

  const _FooterActions({required this.productId});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Column(
        children: [
          LuxuryButton(
            text: 'Quay lại sản phẩm',
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () {
              // Navigate to scent notes
            },
            child: Text(
              'KHÁM PHÁ TẦNG HƯƠNG',
              style: GoogleFonts.montserrat(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.5,
                color: AppTheme.mutedSilver,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
