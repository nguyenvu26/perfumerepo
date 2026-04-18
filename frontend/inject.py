import json
import traceback

vietnamese_data = {
  'support_page': {
    'badge': 'DỊCH VỤ ĐẶC QUYỀN',
    'title': 'Chúng Tôi Có Thể Hỗ Trợ Gì?',
    'subtitle': 'Đội ngũ chuyên gia luôn sẵn lòng dẫn lối bạn qua mọi trải nghiệm khứu giác',
    'email_label': 'Email',
    'phone_label': 'Điện thoại',
    'atelier_label': 'Phòng trưng bày',
    'atelier_value': 'Quận 1, TP. Hồ Chí Minh',
    'hours_label': 'Giờ mở cửa',
    'hours_value': 'T2 - T7: 10:00 - 20:00',
    'form_title': 'Gửi Tin Nhắn Cho Chúng Tôi',
    'form_name': 'Tên Của Bạn',
    'form_name_placeholder': 'Nguyễn Văn A',
    'form_email': 'Địa Chỉ Email',
    'form_email_placeholder': 'nguyenvana@example.com',
    'form_message': 'Tin Nhắn',
    'form_message_placeholder': 'Chúng tôi có thể giúp gì cho bạn hôm nay?',
    'form_submit': 'Gửi Tin Nhắn'
  },
  'privacy_page': {
    'title': 'Chính Sách Bảo Mật',
    'last_updated': 'Cập nhật lần cuối: Tháng 1 năm 2026',
    'key_points': {
      'protection_title': 'Bảo Vệ Dữ Liệu',
      'protection_desc': 'Dữ liệu của bạn được mã hóa an toàn',
      'storage_title': 'Lưu Trữ An Toàn',
      'storage_desc': 'Chuẩn mã hóa công nghiệp',
      'transparency_title': 'Minh Bạch',
      'transparency_desc': 'Chính sách sử dụng dữ liệu rõ ràng',
      'control_title': 'Kiểm Soát',
      'control_desc': 'Bạn toàn quyền kiểm soát dữ liệu cá nhân'
    },
    'sections': {
      'collect_title': 'Thông Tin Thu Thập',
      'collect_desc': 'Chúng tôi thu thập thông tin bạn cung cấp trực tiếp, bao gồm tên, email, sở thích và phản hồi từ các bài phân tích AI để mang đến những gợi ý nước hoa cá nhân hóa chính xác nhất.',
      'use_title': 'Cách Sử Dụng Dữ Liệu',
      'use_desc': 'Dữ liệu được dùng để cải thiện các thuật toán AI, nâng tầm trải nghiệm cá nhân hóa, xử lý đơn hàng và gửi các thông tin sản phẩm liên quan.',
      'ai_title': 'AI & Học Máy',
      'ai_desc': 'Dữ liệu bài phân tích của bạn giúp rèn luyện các mô hình AI. Tất cả đều được ẩn danh và tổng hợp riêng cho mục đích đào tạo AI cốt lõi.',
      'security_title': 'Bảo Mật Hệ Thống',
      'security_desc': 'Chúng tôi áp dụng các tiêu chuẩn an ninh mạng hàng đầu, bao gồm mã hóa, máy chủ bảo mật và kiểm định thường xuyên để bảo vệ thông tin của bạn.',
      'rights_title': 'Quyền Của Bạn',
      'rights_desc': 'Bạn có quyền truy cập, cập nhật hoặc yêu cầu xóa dữ liệu cá nhân bất cứ lúc nào. Vui lòng liên hệ bộ phận Đặc Quyền để được hỗ trợ.'
    }
  },
  'terms_page': {
    'title': 'Điều Khoản Dịch Vụ',
    'last_updated': 'Cập nhật lần cuối: Tháng 1 năm 2026',
    'sections': {
      'acceptance_title': '1. Chấp Nhận Điều Khoản',
      'acceptance_desc': 'Bằng việc truy cập và sử dụng dịch vụ của Perfume GPT, bạn hoàn toàn đồng ý tuân thủ các điều khoản được quy định trong bản thỏa thuận này.',
      'license_title': '2. Cấp Phép Trải Nghiệm',
      'license_desc': 'Được phép tạm thời truy cập các tài liệu trên website Perfume GPT dành cho mục đích cá nhân, phi thương mại.',
      'ai_title': '3. Kết Quả Chẩn Đoán Từ AI',
      'ai_desc': 'Dịch vụ AI của chúng tôi cung cấp các tư vấn quyến rũ mang tính cá nhân hóa. Kết quả dựa trên thuật toán phân tích và nên được xem như những định hướng tham khảo đầy nghệ thuật.',
      'product_title': '4. Tính Chuẩn Xác Thông Tin',
      'product_desc': 'Chúng tôi cam kết đảm bảo tính chính xác trong định giá và diện mạo sản phẩm. Tuy nhiên, sự tinh tế trong mỹ quan có thể không tuyệt đối ở mọi điều kiện.',
      'liability_title': '5. Giới Hạn Trách Nhiệm',
      'liability_desc': 'Trong bất cứ trường hợp nào, Perfume GPT sẽ không chịu trách nhiệm với những rủi ro phát sinh trong quá trình diễn giải hay tiếp nhận dịch vụ tư vấn.'
    }
  },
  'ingredients_page': {
    'title_line1': 'Bộ Sưu Tập',
    'title_line2': 'Hương Liệu Thượng Hạng',
    'subtitle': 'Khám phá di sản phân tử nguyên bản tạo nên những tuyệt tác lưu hương.',
    'ethically_sourced': 'NGUỒN GỐC KẾ THỪA BỀN VỮNG',
    'categories': {
      'resins_title': 'Hương Nhựa Cây (Resins)',
      'resins_desc': 'Trầm Hương Hoàng Gia Oman, Nhựa Labdanum Cổ Điển, Một Dược Somalia',
      'florals_title': 'Hương Hoa Độc Bản (Florals)',
      'florals_desc': 'Nhài Grandiflorum Xứ Grasse, Hồng Đan Mạch Damask, Diên Vĩ Florentine',
      'woods_title': 'Hương Gỗ Trầm Lắng (Woods)',
      'woods_desc': 'Đàn Hương Mysore, Trầm Hương Indonesia, Tuyết Tùng Caledonia',
      'neutrals_title': 'Nguyên Bản (Neutrals)',
      'neutrals_desc': 'Long Diên Hương Sinh Học, Xạ Hương Phân Tử, Cỏ Hương Bài Thanh Khiết'
    }
  },
  'gifting_page': {
    'title_line1': 'Nghệ Thuật',
    'title_line2': 'Quà Tặng Thượng Lưu',
    'subtitle': 'Trao gửi trải nghiệm cá nhân hóa mùi hương đẳng cấp đến những người sành điệu.',
    'physical_category': 'Thực Thể Phân Tử',
    'physical_title_line1': 'Bộ Trải Nghiệm',
    'physical_title_line2': 'Discovery Set',
    'physical_desc': 'Bộ sưu tập thủ công gồm những siêu phẩm của chúng tôi. Lựa chọn tuyệt vời giúp người nhận bước đầu tìm kiếm dải tần rung động trước khi đến với phòng thí nghiệm AI.',
    'physical_cta': 'Mua Bộ Trải Nghiệm • 2.000.000đ',
    'digital_category': 'Thẻ Mời Đặc Quyền',
    'digital_title_line1': 'Thẻ Điện Tử',
    'digital_title_line2': 'Atelier Pass',
    'digital_desc': 'Tấm vé danh giá tham gia chuyến hành trình tinh xảo AI. Món quà trao gửi một dấu ấn phân tử độc bản, được thiết lập ngay tức thì qua cổng điện tử hoàng gia.',
    'digital_cta': 'Gửi Tặng Thẻ Đặc Quyền • 5.500.000đ'
  },
  'journal_page': {
    'loading': 'Đang tải hệ thống tạp chí...',
    'empty_title': 'Tạp chí Perfume GPT',
    'empty_desc': 'Hiện chưa có ấn bản nào được xuất bản.',
    'header_badge': 'Biên Tập Điểm Nhấn',
    'header_title': 'Ấn Bản Kỷ Nguyên',
    'header_desc': 'Khám phá nghệ thuật chế tác hương thơm, câu chuyện lịch sử và nguồn cảm hứng bất tận đằng sau mỗi giọt nước hoa.',
    'featured_badge': 'Tiêu Điểm',
    'read_more': 'Đọc Ký Sự'
  }
}

english_data = {
  'support_page': {
    'badge': 'Concierge Service',
    'title': 'How Can We Assist?',
    'subtitle': 'Our dedicated team is here to guide you through your olfactory journey',
    'email_label': 'Email',
    'phone_label': 'Phone',
    'atelier_label': 'Atelier',
    'atelier_value': 'District 1, Ho Chi Minh City',
    'hours_label': 'Hours',
    'hours_value': 'Mon-Sat: 10AM - 8PM',
    'form_title': 'Send Us a Message',
    'form_name': 'Your Name',
    'form_name_placeholder': 'Alexander Dupont',
    'form_email': 'Email Address',
    'form_email_placeholder': 'alexander@example.com',
    'form_message': 'Message',
    'form_message_placeholder': 'How can we help you today?',
    'form_submit': 'Send Message'
  },
  'privacy_page': {
    'title': 'Privacy Policy',
    'last_updated': 'Last updated: January 2026',
    'key_points': {
       'protection_title': 'Data Protection',
       'protection_desc': 'Your data is encrypted and secure',
       'storage_title': 'Secure Storage',
       'storage_desc': 'Industry-standard encryption',
       'transparency_title': 'Transparency',
       'transparency_desc': 'Clear data usage policies',
       'control_title': 'Data Control',
       'control_desc': 'You own your data'
    },
    'sections': {
      'collect_title': 'Information We Collect',
      'collect_desc': 'We collect information you provide directly to us, including your name, email address, preferences, and AI consultation responses to provide personalized fragrance recommendations.',
      'use_title': 'How We Use Your Data',
      'use_desc': 'We use your data to improve our AI algorithms, provide personalized experiences, process orders, and send you relevant updates about products and services.',
      'ai_title': 'AI & Machine Learning',
      'ai_desc': 'Your consultation data helps train our AI models. All data is anonymized and aggregated for machine learning purposes.',
      'security_title': 'Data Security',
      'security_desc': 'We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information.',
      'rights_title': 'Your Rights',
      'rights_desc': 'You have the right to access, update, or delete your personal data at any time. Contact our support team for assistance.'
    }
  },
  'terms_page': {
    'title': 'Terms of Service',
    'last_updated': 'Last updated: January 2026',
    'sections': {
      'acceptance_title': '1. Acceptance of Terms',
      'acceptance_desc': 'By accessing and using Perfume GPT AI services, you accept and agree to be bound by the terms and provision of this agreement.',
      'license_title': '2. Use License',
      'license_desc': 'Permission is granted to temporarily access the materials on Perfume GPT AI\'s website for personal, non-commercial transitory viewing only.',
      'ai_title': '3. AI-Generated Content',
      'ai_desc': 'Our AI consultation service provides personalized fragrance recommendations. Results are based on algorithmic analysis and should be considered as suggestions.',
      'product_title': '4. Product Information',
      'product_desc': 'We strive to provide accurate product descriptions and pricing. However, we do not warrant that product descriptions or other content is accurate, complete, or error-free.',
      'liability_title': '5. Limitation of Liability',
      'liability_desc': 'In no event shall Perfume GPT AI or its suppliers be liable for any damages arising out of the use or inability to use our services.'
    }
  },
  'ingredients_page': {
    'title_line1': 'The',
    'title_line2': 'Anthology',
    'subtitle': 'Explore the raw molecular heritage that defines our syntheses.',
    'ethically_sourced': 'Ethically Sourced',
    'categories': {
      'resins_title': 'The Resins',
      'resins_desc': 'Omani Frankincense, Aged Labdanum, Somalian Myrrh',
      'florals_title': 'The Florals',
      'florals_desc': 'Grasse Jasmine Grandiflorum, Bulgarian Damask Rose, Florentine Iris',
      'woods_title': 'The Woods',
      'woods_desc': 'Mysore Sandalwood, Indonesian Oud, Caledonian Cedar',
      'neutrals_title': 'The Neutrals',
      'neutrals_desc': 'Ethical Ambergris, Molecular Musk, Clean Vetiver'
    }
  },
  'gifting_page': {
    'title_line1': 'The Art of',
    'title_line2': 'Giving',
    'subtitle': 'Bestow the luxury of a personal olfactory journey upon another.',
    'physical_category': 'The Physical',
    'physical_title_line1': 'Discovery Set',
    'physical_title_line2': '',
    'physical_desc': 'A hand-packaged selection of our permanent collection, allowing them to find their initial resonance before the AI synthesis.',
    'physical_cta': 'Buy Physical Set • 2.000.000đ',
    'digital_category': 'The Digital',
    'digital_title_line1': 'Atelier Pass',
    'digital_title_line2': '',
    'digital_desc': 'An invitation to our AI-powered consultation. The gift of a bespoke molecular signature delivered instantly via the digital registry.',
    'digital_cta': 'Send Digital Pass • 5.500.000đ'
  },
  'journal_page': {
    'loading': 'Loading Editorial...',
    'empty_title': 'The Perfume GPT Journal',
    'empty_desc': 'No editorial releases have been published yet.',
    'header_badge': 'Editorial',
    'header_title': 'The Edition',
    'header_desc': 'Explore the art of fragrance making, historical narratives, and endless inspiration behind every drop of perfume.',
    'featured_badge': 'Featured',
    'read_more': 'Read Article'
  }
}

try:
    with open('d:/Sale/Perfume-Sales/frontend/messages/vi.json', 'r', encoding='utf-8') as f:
        vi_json = json.load(f)
    vi_json.update(vietnamese_data)
    with open('d:/Sale/Perfume-Sales/frontend/messages/vi.json', 'w', encoding='utf-8') as f:
        json.dump(vi_json, f, ensure_ascii=False, indent=2)

    with open('d:/Sale/Perfume-Sales/frontend/messages/en.json', 'r', encoding='utf-8') as f:
        en_json = json.load(f)
    en_json.update(english_data)
    with open('d:/Sale/Perfume-Sales/frontend/messages/en.json', 'w', encoding='utf-8') as f:
        json.dump(en_json, f, ensure_ascii=False, indent=2)
    print('SUCCESS')
except Exception as e:
    print(traceback.format_exc())
