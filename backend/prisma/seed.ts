import { PrismaClient, ScentNoteType } from '@prisma/client';

const prisma = new PrismaClient();

const toSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const BRAND_DATA = [
  'Chanel', 'Dior', 'Le Labo', 'Tom Ford', 'Creed', 
  'Byredo', 'Maison Francis Kurkdjian', 'Yves Saint Laurent', 'Giorgio Armani', 'Versace',
  'Kilian', 'Jo Malone', 'Parfums de Marly', 'Mancera', 'Xerjoff',
  'Roja Parfums', 'Amouage', 'Nishane', 'Penhaligon\'s', 'Hermès'
];

const CATEGORY_DATA = ['Niche', 'Designer', 'Indie'];

const FAMILY_DATA = ['Floral', 'Woody', 'Oriental', 'Fresh', 'Citrus', 'Gourmand', 'Fougère'];

// Helper for random variants
const getVariants = (basePrice: number) => {
  return [
    { name: '50ml', price: basePrice, stock: Math.floor(Math.random() * 50) + 10 },
    { name: '100ml', price: Math.floor(basePrice * 1.6), stock: Math.floor(Math.random() * 50) + 10 }
  ];
};

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Categories
  console.log('Creating categories...');
  const categories = await Promise.all(
    CATEGORY_DATA.map(c => 
      prisma.category.upsert({
        where: { name: c },
        update: {},
        create: { name: c, description: `Danh mục nước hoa ${c}` }
      })
    )
  );

  // 2. Create Scent Families
  console.log('Creating scent families...');
  const families = await Promise.all(
    FAMILY_DATA.map(f => 
      prisma.scentFamily.upsert({
        where: { name: f },
        update: {},
        create: { name: f, description: `Nhóm hương ${f} đặc trưng` }
      })
    )
  );

  // 3. Create Brands
  console.log('Creating brands...');
  const brands = await Promise.all(
    BRAND_DATA.map(b => 
      prisma.brand.upsert({
        where: { name: b },
        update: {},
        create: { name: b, description: `Thương hiệu nước hoa cao cấp ${b}` }
      })
    )
  );

  const getBrandId = (name: string) => brands.find(b => b.name === name)?.id || brands[0].id;
  const getCatId = (name: string) => categories.find(c => c.name === name)?.id || categories[0].id;
  const getFamId = (name: string) => families.find(f => f.name === name)?.id || families[0].id;

  // 4. Perfumes Data (60 items)
  const PERFUMES = [
    // Chanel (Designer)
    {
      name: 'Bleu de Chanel EDP', brand: 'Chanel', cat: 'Designer', fam: 'Woody',
      gender: 'Nam', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Vừa phải',
      seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hằng ngày', 'Hẹn hò'], styles: ['Thanh lịch', 'Nam tính'], targetAge: '25-40',
      ingredients: 'Alcohol, Parfum, Aqua, Limonene, Linalool',
      notes: { top: ['Bưởi', 'Chanh', 'Bạc hà'], middle: ['Gừng', 'Nhục đậu khấu', 'Hoa nhài'], base: ['Hương nhang', 'Gỗ tuyết tùng', 'Hổ phách'] },
      price: 3500000, desc: 'Biểu tượng của sự tự do nam tính. Một mùi hương quyến rũ, mạnh mẽ nhưng đầy thanh lịch.',
      analysis: 'Mở đầu tươi mát với cam chanh, sau đó chuyển dần sang tông gỗ tuyết tùng và nhang trầm ấm áp, tạo cảm giác sang trọng và an toàn.'
    },
    {
      name: 'Coco Mademoiselle EDP', brand: 'Chanel', cat: 'Designer', fam: 'Oriental',
      gender: 'Nữ', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Xa',
      seasons: ['Xuân', 'Thu', 'Đông'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hẹn hò', 'Tiệc tùng'], styles: ['Sang trọng', 'Quyến rũ'], targetAge: '20+',
      ingredients: 'Alcohol, Parfum, Aqua, Linalool, Limonene',
      notes: { top: ['Cam', 'Quýt', 'Hoa cam'], middle: ['Hoa hồng', 'Hoa nhài', 'Ngọc lan tây'], base: ['Hoắc hương', 'Xạ hương trắng', 'Vani'] },
      price: 3800000, desc: 'Sự kết hợp hoàn hảo giữa nét hiện đại và cổ điển. Mùi hương của một người phụ nữ tự do và táo bạo.',
      analysis: 'Hương thơm phương Đông rực rỡ với sự bùng nổ của cam quýt, dịu lại bằng hoắc hương và hoa hồng, cực kỳ cuốn hút.'
    },
    { name: 'Chanel No 5 EDP', brand: 'Chanel', cat: 'Designer', fam: 'Floral', gender: 'Nữ', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Tiệc tùng', 'Sự kiện'], styles: ['Cổ điển', 'Sang trọng'], targetAge: '30+', ingredients: 'Alcohol, Aqua, Parfum', notes: { top: ['Aldehyde', 'Ngọc lan tây', 'Hoa cam'], middle: ['Hoa nhài', 'Hoa hồng'], base: ['Gỗ đàn hương', 'Cỏ hương bài'] }, price: 4000000, desc: 'Huyền thoại nước hoa mọi thời đại.', analysis: 'Hương Aldehyde đặc trưng tạo nên sự lấp lánh, kết hợp với hoa nhài và gỗ đàn hương sâu lắng.' },
    { name: 'Allure Homme Sport', brand: 'Chanel', cat: 'Designer', fam: 'Fresh', gender: 'Nam', concentration: 'EDT', longevity: '4-6 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ'], timeOfDay: ['Ban ngày'], occasions: ['Thể thao', 'Hằng ngày'], styles: ['Năng động', 'Khỏe khoắn'], targetAge: '20+', ingredients: 'Alcohol, Parfum', notes: { top: ['Cam', 'Hương biển'], middle: ['Tiêu', 'Hoa cam'], base: ['Đậu Tonka', 'Hổ phách'] }, price: 2800000, desc: 'Mang lại sự tươi mát tức thì.', analysis: 'Cảm giác của gió biển và cam quýt, dry down với đậu Tonka ngọt nhẹ nhưng nam tính.' },
    { name: 'Chance Eau Tendre', brand: 'Chanel', cat: 'Designer', fam: 'Floral', gender: 'Nữ', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ'], timeOfDay: ['Ban ngày'], occasions: ['Đi học', 'Hẹn hò'], styles: ['Nữ tính', 'Nhẹ nhàng'], targetAge: '18-30', ingredients: 'Alcohol, Parfum', notes: { top: ['Mộc qua', 'Bưởi'], middle: ['Hoa huệ dạ hương', 'Hoa nhài'], base: ['Xạ hương', 'Hoa diên vĩ'] }, price: 3200000, desc: 'Sự nữ tính, mềm mại và rạng rỡ.', analysis: 'Mùi hương hoa cỏ trái cây tươi sáng, dịu dàng và cực kỳ dễ chịu.' },
    
    // Dior
    { name: 'Sauvage EDT', brand: 'Dior', cat: 'Designer', fam: 'Fresh', gender: 'Nam', concentration: 'EDT', longevity: '8-12 tiếng', sillage: 'Xa', seasons: ['Xuân', 'Hạ', 'Thu', 'Đông'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hẹn hò', 'Tiệc tùng'], styles: ['Nam tính', 'Bụi bặm'], targetAge: '20+', ingredients: 'Alcohol, Parfum', notes: { top: ['Cam Bergamot', 'Tiêu'], middle: ['Tiêu Tứ Xuyên', 'Hoa oải hương', 'Hoắc hương'], base: ['Ambroxan', 'Gỗ tuyết tùng'] }, price: 2500000, desc: 'Mạnh mẽ, hoang dại và đầy cuốn hút.', analysis: 'Ambroxan kết hợp tiêu đen tạo ra độ bám tỏa cực kỳ khủng khiếp.' },
    { name: 'Miss Dior Blooming Bouquet', brand: 'Dior', cat: 'Designer', fam: 'Floral', gender: 'Nữ', concentration: 'EDT', longevity: '4-6 tiếng', sillage: 'Gần', seasons: ['Xuân', 'Hạ'], timeOfDay: ['Ban ngày'], occasions: ['Đi học', 'Hằng ngày'], styles: ['Tiểu thư', 'Ngọt ngào'], targetAge: '18-25', ingredients: 'Alcohol, Parfum', notes: { top: ['Quýt', 'Cam Bergamot'], middle: ['Hoa mẫu đơn', 'Hoa hồng'], base: ['Xạ hương trắng'] }, price: 2700000, desc: 'Như một bó hoa mùa xuân tươi tắn.', analysis: 'Hương hoa mẫu đơn và hoa hồng trong trẻo, rất nịnh mũi nhưng bám hơi kém.' },
    { name: 'J\'adore EDP', brand: 'Dior', cat: 'Designer', fam: 'Floral', gender: 'Nữ', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Sự kiện'], styles: ['Qúy phái', 'Trưởng thành'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Lê', 'Dưa lưới', 'Đào'], middle: ['Hoa nhài', 'Hoa huệ', 'Hoa hồng'], base: ['Xạ hương', 'Vani', 'Tuyêt tùng'] }, price: 3400000, desc: 'Hương thơm rực rỡ và lấp lánh như vàng.', analysis: 'Một bó hoa trắng nở rộ, quyến rũ và quyền lực.' },
    { name: 'Dior Homme Intense', brand: 'Dior', cat: 'Designer', fam: 'Woody', gender: 'Nam', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Vừa phải', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Hẹn hò', 'Tiệc tùng'], styles: ['Lịch lãm', 'Cuốn hút'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Hoa oải hương'], middle: ['Hoa diên vĩ', 'Vani đực', 'Lê'], base: ['Cỏ hương bài', 'Gỗ tuyết tùng'] }, price: 3000000, desc: 'Tinh hoa của sự nam tính lịch lãm.', analysis: 'Diên vĩ phấn phấn đặc trưng kết hợp với gỗ và ca cao tạo cảm giác ấm áp, sang trọng.' },

    // Le Labo
    { name: 'Santal 33', brand: 'Le Labo', cat: 'Niche', fam: 'Woody', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hẹn hò', 'Cafe'], styles: ['Cá tính', 'Tối giản'], targetAge: '20+', ingredients: 'Alcohol, Parfum', notes: { top: ['Thảo quả', 'Diên vĩ'], middle: ['Hoa violet', 'Giấy cói'], base: ['Gỗ đàn hương', 'Gỗ tuyết tùng', 'Da thuộc'] }, price: 6500000, desc: 'Biểu tượng của giới thời trang và người yêu mùi hương Niche.', analysis: 'Mùi gỗ đàn hương kết hợp da thuộc và mùi gỗ xưởng mộc, mang lại cảm giác dry, sạch sẽ và cực kỳ signature.' },
    { name: 'Another 13', brand: 'Le Labo', cat: 'Niche', fam: 'Woody', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ', 'Thu', 'Đông'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hằng ngày'], styles: ['Sạch sẽ', 'Thoắt ẩn thoắt hiện'], targetAge: 'Mọi lứa tuổi', ingredients: 'Alcohol, Parfum', notes: { top: ['Lê', 'Cam quýt'], middle: ['Ambrette', 'Amyl Salicylate'], base: ['Xạ hương', 'Iso E Super'] }, price: 6500000, desc: 'Mùi hương của sự tối giản và bí ẩn.', analysis: 'Iso E Super tạo cảm giác mùi da thịt sạch sẽ, đôi khi thoảng mùi trang giấy mới, rất nịnh mũi.' },
    { name: 'Rose 31', brand: 'Le Labo', cat: 'Niche', fam: 'Floral', gender: 'Unisex', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Thu', 'Đông'], timeOfDay: ['Cả ngày'], occasions: ['Hẹn hò', 'Cafe'], styles: ['Bí ẩn', 'Cuốn hút'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Hoa hồng', 'Thì là'], middle: ['Hoa hồng', 'Cỏ hương bài', 'Gỗ tuyết tùng'], base: ['Xạ hương', 'Gỗ trầm hương', 'Nhũ hương'] }, price: 6500000, desc: 'Hoa hồng nhưng không nữ tính, cay nồng và đầy lôi cuốn.', analysis: 'Hoa hồng quyện với thì là (cumin) và gỗ tuyết tùng tạo nên một mùi hương gai góc, quyến rũ.' },

    // Tom Ford
    { name: 'Oud Wood', brand: 'Tom Ford', cat: 'Niche', fam: 'Woody', gender: 'Unisex', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Tiệc tùng', 'Sự kiện'], styles: ['Quyền lực', 'Sang trọng'], targetAge: '30+', ingredients: 'Alcohol, Parfum', notes: { top: ['Gỗ cẩm lai', 'Thảo quả'], middle: ['Trầm hương', 'Gỗ đàn hương', 'Cỏ hương bài'], base: ['Đậu Tonka', 'Hổ phách', 'Vani'] }, price: 7500000, desc: 'Một trong những mùi hương Trầm (Oud) dễ dùng và sang trọng nhất.', analysis: 'Trầm hương tây hóa, mềm mại và kết hợp hoàn hảo với gỗ đàn hương, vani.' },
    { name: 'Tobacco Vanille', brand: 'Tom Ford', cat: 'Niche', fam: 'Gourmand', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Tiệc tùng', 'Hẹn hò'], styles: ['Quyến rũ', 'Ấm áp'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Lá thuốc lá', 'Gia vị cay'], middle: ['Đậu Tonka', 'Vani', 'Ca cao', 'Hoa thuốc lá'], base: ['Trái cây sấy', 'Hương gỗ'] }, price: 7500000, desc: 'Cảm giác như bước vào một câu lạc bộ quý ông thượng lưu ở London.', analysis: 'Sự hòa quyện tuyệt vời giữa thuốc lá tươi và vani ngọt ngào, siêu bám tỏa.' },
    { name: 'Ombré Leather', brand: 'Tom Ford', cat: 'Designer', fam: 'Woody', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Đi phượt', 'Tiệc tùng'], styles: ['Bụi bặm', 'Nam tính'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Thảo quả'], middle: ['Da thuộc', 'Hoa nhài Sambac'], base: ['Hổ phách', 'Rêu sồi', 'Hoắc hương'] }, price: 4500000, desc: 'Mùi hương da thuộc bụi bặm nhưng vẫn giữ được nét quyến rũ.', analysis: 'Hương da thuộc chân thật nhất, hòa quyện với hoa nhài làm mềm mại đi sự gai góc.' },

    // Creed
    { name: 'Aventus', brand: 'Creed', cat: 'Niche', fam: 'Citrus', gender: 'Nam', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Xa', seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Sự kiện'], styles: ['Thành đạt', 'Quyền lực'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Dứa', 'Cam Bergamot', 'Táo đen', 'Nho đen'], middle: ['Bạch dương', 'Hoắc hương', 'Hoa hồng Maroc', 'Hoa nhài'], base: ['Xạ hương', 'Rêu sồi', 'Long diên hương', 'Vani'] }, price: 8000000, desc: 'Vị vua của nước hoa nam giới.', analysis: 'Tổ hợp Dứa - Khói (Bạch dương) vô tiền khoáng hậu, biểu tượng của sự thành đạt.' },
    { name: 'Silver Mountain Water', brand: 'Creed', cat: 'Niche', fam: 'Fresh', gender: 'Unisex', concentration: 'EDP', longevity: '4-6 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ'], timeOfDay: ['Ban ngày'], occasions: ['Đi làm', 'Du lịch'], styles: ['Tinh khiết', 'Mát mẻ'], targetAge: '20+', ingredients: 'Alcohol, Parfum', notes: { top: ['Cam Bergamot', 'Quýt'], middle: ['Trà xanh', 'Quả lý chua đen'], base: ['Xạ hương', 'Nhựa Galbanum', 'Gỗ đàn hương', 'Petitgrain'] }, price: 7500000, desc: 'Mát lạnh như dòng suối tinh khiết trên dãy Alps.', analysis: 'Hương trà xanh và lý chua đen mang lại cảm giác vô cùng thư giãn, trong veo.' },
    { name: 'Green Irish Tweed', brand: 'Creed', cat: 'Niche', fam: 'Fougère', gender: 'Nam', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hằng ngày'], styles: ['Cổ điển', 'Lịch lãm'], targetAge: '30+', ingredients: 'Alcohol, Parfum', notes: { top: ['Cỏ roi ngựa', 'Hoa diên vĩ'], middle: ['Lá violet'], base: ['Long diên hương', 'Gỗ đàn hương'] }, price: 7000000, desc: 'Mùi hương của sự sang trọng cổ điển và quý tộc Anh.', analysis: 'Hương cỏ xanh tươi mát điểm thêm diên vĩ và gỗ, gợi nhớ đến những cánh đồng cỏ ướt sương.' },

    // Byredo
    { name: 'Bal d\'Afrique', brand: 'Byredo', cat: 'Niche', fam: 'Woody', gender: 'Unisex', concentration: 'EDP', longevity: '4-6 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Ban ngày'], occasions: ['Đi làm', 'Hằng ngày'], styles: ['Lạc quan', 'Vui vẻ'], targetAge: '20+', ingredients: 'Alcohol, Parfum', notes: { top: ['Chanh', 'Hoa cúc vạn thọ', 'Cam Bergamot', 'Hoa cam', 'Bucchu'], middle: ['Hoa violet', 'Hoa anh thảo', 'Hoa nhài'], base: ['Cỏ hương bài', 'Hổ phách', 'Xạ hương', 'Gỗ tuyết tùng'] }, price: 5500000, desc: 'Sự pha trộn rực rỡ và lãng mạn của văn hóa châu Phi.', analysis: 'Mùi cỏ hương bài ngọt ngào kết hợp cam chanh, tạo cảm giác cực kỳ fresh và sạch sẽ.' },
    { name: 'Gypsy Water', brand: 'Byredo', cat: 'Niche', fam: 'Woody', gender: 'Unisex', concentration: 'EDP', longevity: '4-6 tiếng', sillage: 'Gần', seasons: ['Xuân', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Cafe', 'Hằng ngày'], styles: ['Thơ mộng', 'Nhẹ nhàng'], targetAge: '20+', ingredients: 'Alcohol, Parfum', notes: { top: ['Cây bách xù', 'Chanh', 'Cam Bergamot', 'Tiêu'], middle: ['Lá thông', 'Hương nhang', 'Rễ diên vĩ'], base: ['Vani', 'Gỗ đàn hương', 'Hổ phách'] }, price: 5500000, desc: 'Mùi hương của người du mục tự do, tĩnh lặng.', analysis: 'Một chút gỗ, một chút vani, thoang thoảng như sương sớm trong khu rừng lá kim.' },
    { name: 'Mojave Ghost', brand: 'Byredo', cat: 'Niche', fam: 'Floral', gender: 'Unisex', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ'], timeOfDay: ['Ban ngày'], occasions: ['Đi làm', 'Hằng ngày'], styles: ['Bí ẩn', 'Thu hút'], targetAge: '20+', ingredients: 'Alcohol, Parfum', notes: { top: ['Hồng xiêm', 'Ambrette'], middle: ['Hoa violet', 'Gỗ đàn hương', 'Hoa mộc lan'], base: ['Long diên hương', 'Gỗ tuyết tùng'] }, price: 5500000, desc: 'Lấy cảm hứng từ loài hoa ma quái mọc trên sa mạc Mojave.', analysis: 'Hương thơm trái cây thanh lịch kết hợp với gỗ đàn hương, bám tỏa vô cùng bất ngờ.' },

    // Maison Francis Kurkdjian
    { name: 'Baccarat Rouge 540 EDP', brand: 'Maison Francis Kurkdjian', cat: 'Niche', fam: 'Oriental', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Rất xa', seasons: ['Thu', 'Đông', 'Xuân'], timeOfDay: ['Cả ngày'], occasions: ['Tiệc tùng', 'Sự kiện', 'Hẹn hò'], styles: ['Sang trọng', 'Lấp lánh'], targetAge: '20+', ingredients: 'Alcohol, Parfum, Aqua', notes: { top: ['Hoa nhài', 'Nhụy hoa nghệ tây'], middle: ['Amberwood', 'Long diên hương'], base: ['Nhựa rêu sồi', 'Gỗ tuyết tùng'] }, price: 7500000, desc: 'Viên pha lê đỏ huyền thoại, sáng bóng và sắc lẹm.', analysis: 'Hương ngọt của kẹo bông kết hợp với sự sắc lạnh của saffron và gỗ, tạo hiệu ứng mây mùi (scent cloud) kinh điển.' },
    { name: 'Grand Soir', brand: 'Maison Francis Kurkdjian', cat: 'Niche', fam: 'Oriental', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Tiệc tùng', 'Sự kiện'], styles: ['Ấm áp', 'Lộng lẫy'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Nhựa cây Labdanum Tây Ban Nha'], middle: ['Đậu Tonka', 'Nhũ hương'], base: ['Vani', 'Hổ phách'] }, price: 6000000, desc: 'Buổi tối tráng lệ tại Paris.', analysis: 'Hổ phách và Vani ấm áp, mượt mà và cực kỳ sang trọng, rực rỡ như ánh đèn đêm Paris.' },

    // YSL
    { name: 'Y EDP', brand: 'Yves Saint Laurent', cat: 'Designer', fam: 'Fougère', gender: 'Nam', concentration: 'EDP', longevity: '8-12 tiếng', sillage: 'Xa', seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Tiệc tùng', 'Hẹn hò'], styles: ['Năng động', 'Nam tính'], targetAge: '20-35', ingredients: 'Alcohol, Parfum', notes: { top: ['Táo', 'Gừng', 'Cam Bergamot'], middle: ['Cây xô thơm', 'Quả bách xù', 'Hoa phong lữ'], base: ['Amberwood', 'Đậu Tonka', 'Gỗ tuyết tùng', 'Cỏ hương bài', 'Nhũ hương'] }, price: 3200000, desc: 'Mùi hương "blue" toàn năng dành cho người đàn ông hiện đại.', analysis: 'Táo xanh tươi mát kết hợp với sage và gỗ hổ phách mạnh mẽ, cực kỳ đa dụng.' },
    { name: 'La Nuit de l\'Homme', brand: 'Yves Saint Laurent', cat: 'Designer', fam: 'Woody', gender: 'Nam', concentration: 'EDT', longevity: '4-6 tiếng', sillage: 'Vừa phải', seasons: ['Thu', 'Đông', 'Xuân'], timeOfDay: ['Ban đêm'], occasions: ['Hẹn hò', 'Club'], styles: ['Quyến rũ', 'Lãng mạn'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Thảo quả'], middle: ['Hoa oải hương', 'Gỗ tuyết tùng', 'Cam Bergamot'], base: ['Cỏ hương bài', 'Caraway'] }, price: 2800000, desc: 'Vũ khí tán tỉnh trong những buổi hẹn hò đêm.', analysis: 'Thảo quả nồng nàn hòa quyện với oải hương tạo nên sự ngọt ngào, nam tính và cực kỳ khiêu khích.' },
    
    // Giorgio Armani
    { name: 'Acqua di Giò Profumo', brand: 'Giorgio Armani', cat: 'Designer', fam: 'Fresh', gender: 'Nam', concentration: 'Parfum', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hằng ngày'], styles: ['Trưởng thành', 'Mát mẻ'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Hương biển', 'Cam Bergamot'], middle: ['Hương thảo', 'Cây xô thơm', 'Hoa phong lữ'], base: ['Hương nhang', 'Hoắc hương'] }, price: 3000000, desc: 'Sự giao thoa giữa biển khơi và đá đen.', analysis: 'Hương vị biển cả quen thuộc của bản gốc được nâng cấp với nhang và hoắc hương, nam tính và sâu sắc hơn.' },

    // Versace
    { name: 'Eros EDT', brand: 'Versace', cat: 'Designer', fam: 'Oriental', gender: 'Nam', concentration: 'EDT', longevity: '8-12 tiếng', sillage: 'Rất xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Tiệc tùng', 'Club'], styles: ['Nổi bật', 'Quyến rũ'], targetAge: '18-30', ingredients: 'Alcohol, Parfum', notes: { top: ['Bạc hà', 'Táo xanh', 'Chanh'], middle: ['Đậu Tonka', 'Ambroxan', 'Hoa phong lữ'], base: ['Vani', 'Gỗ tuyết tùng', 'Cỏ hương bài', 'Rêu sồi'] }, price: 2200000, desc: 'Vị thần tình yêu đầy đam mê và mãnh liệt.', analysis: 'Bạc hà mát lạnh mở đầu, sau đó chuyển sang sự ngọt ngào bùng nổ của Vani và Tonka.' },

    // Kilian
    { name: 'Angels\' Share', brand: 'Kilian', cat: 'Niche', fam: 'Gourmand', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Tiệc tùng', 'Hẹn hò'], styles: ['Ngọt ngào', 'Sang trọng'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Cognac'], middle: ['Quế', 'Đậu Tonka', 'Rêu sồi'], base: ['Praline', 'Vani', 'Gỗ đàn hương'] }, price: 6800000, desc: 'Phần rượu tinh túy bay hơi dành cho các thiên thần.', analysis: 'Hương rượu Cognac nồng ấm quyện cùng quế và praline, một chiếc bánh táo tẩm rượu hoàn hảo cho mùa đông.' },

    // Jo Malone
    { name: 'Wood Sage & Sea Salt', brand: 'Jo Malone', cat: 'Niche', fam: 'Fresh', gender: 'Unisex', concentration: 'Cologne', longevity: '4-6 tiếng', sillage: 'Gần', seasons: ['Xuân', 'Hạ'], timeOfDay: ['Ban ngày'], occasions: ['Hằng ngày', 'Đi dạo'], styles: ['Tự nhiên', 'Thư giãn'], targetAge: 'Mọi lứa tuổi', ingredients: 'Alcohol, Parfum', notes: { top: ['Ambrette'], middle: ['Muối biển', 'Xô thơm'], base: ['Tảo biển', 'Bưởi'] }, price: 4000000, desc: 'Cảm giác đi dạo trên bờ biển Anh lộng gió.', analysis: 'Hương thơm mặn mòi của muối biển hòa cùng thảo mộc xô thơm, cực kỳ dễ chịu và gần gũi thiên nhiên.' },
    
    // Parfums de Marly
    { name: 'Layton', brand: 'Parfums de Marly', cat: 'Niche', fam: 'Oriental', gender: 'Nam', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Cả ngày'], occasions: ['Hẹn hò', 'Sự kiện'], styles: ['Quyến rũ', 'Vương giả'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Táo', 'Oải hương', 'Cam Bergamot', 'Quýt'], middle: ['Hoa phong lữ', 'Hoa violet', 'Hoa nhài'], base: ['Vani', 'Thảo quả', 'Gỗ đàn hương', 'Tiêu', 'Hoắc hương', 'Gỗ Guaiac'] }, price: 6500000, desc: 'Mùi hương của sự xa hoa và quyến rũ bậc nhất.', analysis: 'Sự kết hợp hoàn hảo giữa táo, vani và các gia vị cay ấm, nịnh mũi và bám tỏa cực kỳ tốt.' },
    { name: 'Delina', brand: 'Parfums de Marly', cat: 'Niche', fam: 'Floral', gender: 'Nữ', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Hẹn hò', 'Sự kiện'], styles: ['Nữ tính', 'Qúy tộc'], targetAge: '20+', ingredients: 'Alcohol, Parfum', notes: { top: ['Quả vải', 'Đại hoàng', 'Cam Bergamot', 'Nhục đậu khấu'], middle: ['Hoa hồng Thổ Nhĩ Kỳ', 'Hoa mẫu đơn', 'Xạ hương', 'Petalia', 'Vani'], base: ['Cashmeran', 'Gỗ tuyết tùng', 'Cỏ hương bài Nam Phi', 'Hương nhang'] }, price: 7000000, desc: 'Một bó hoa hồng hoàng gia tươi thắm và chua nhẹ.', analysis: 'Hoa hồng ngập tràn, kết hợp với vị chua chua của quả vải và đại hoàng, tạo nên sự quyến rũ vô song.' },

    // Mancera
    { name: 'Cedrat Boise', brand: 'Mancera', cat: 'Niche', fam: 'Woody', gender: 'Nam', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hằng ngày'], styles: ['Mạnh mẽ', 'Nam tính'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Chanh Sicily', 'Quả lý chua đen', 'Cam Bergamot', 'Gia vị'], middle: ['Hương trái cây', 'Lá hoắc hương', 'Hoa nhài nước'], base: ['Gỗ tuyết tùng', 'Da thuộc', 'Gỗ đàn hương', 'Vani', 'Rêu sồi', 'Xạ hương'] }, price: 3500000, desc: 'Sự thay thế hoàn hảo cho Aventus với mức giá tốt hơn.', analysis: 'Hương chanh mát mẻ mở đầu, kéo theo tông gỗ và da thuộc ấm áp ở hậu vị, bám tỏa cực kỳ ấn tượng.' },

    // Xerjoff
    { name: 'Naxos', brand: 'Xerjoff', cat: 'Niche', fam: 'Gourmand', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Rất xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Cả ngày'], occasions: ['Sự kiện', 'Tiệc tùng'], styles: ['Quyền lực', 'Ngọt ngào'], targetAge: '30+', ingredients: 'Alcohol, Parfum', notes: { top: ['Hoa oải hương', 'Cam Bergamot', 'Chanh'], middle: ['Mật ong', 'Quế', 'Cashmeran', 'Hoa nhài Sambac'], base: ['Lá thuốc lá', 'Vani', 'Đậu Tonka'] }, price: 7500000, desc: 'Biểu tượng của sự giàu có và thịnh vượng đến từ Ý.', analysis: 'Mật ong, hoa oải hương và thuốc lá hòa quyện, ngọt ngào nhưng không gắt, sang trọng tột bậc.' },

    // Roja Parfums
    { name: 'Elysium Pour Homme', brand: 'Roja Parfums', cat: 'Niche', fam: 'Citrus', gender: 'Nam', concentration: 'Parfum Cologne', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Hạ'], timeOfDay: ['Ban ngày'], occasions: ['Đi làm', 'Sự kiện VIP'], styles: ['Sang trọng', 'Thành đạt'], targetAge: '30+', ingredients: 'Alcohol, Parfum', notes: { top: ['Bưởi', 'Chanh', 'Cam Bergamot', 'Quả chanh vàng', 'Ngải cứu', 'Nhựa Galbanum'], middle: ['Cỏ hương bài', 'Quả bách xù', 'Quả lý chua đen', 'Táo', 'Hoa hồng', 'Hoa nhài', 'Hoa linh lan'], base: ['Long diên hương', 'Da thuộc', 'Vani', 'An tức hương', 'Nhựa rêu sồi'] }, price: 9000000, desc: 'Mùi hương của sự thành công và quyền lực.', analysis: 'Citrus cực kỳ tự nhiên, phức tạp nhưng lại mượt mà vô cùng nhờ base long diên hương xịn xò.' },

    // Amouage
    { name: 'Interlude Man', brand: 'Amouage', cat: 'Niche', fam: 'Oriental', gender: 'Nam', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Rất xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Sự kiện', 'Ngoài trời'], styles: ['Uy quyền', 'Hoang dại'], targetAge: '35+', ingredients: 'Alcohol, Parfum', notes: { top: ['Lá Oregano', 'Tiêu', 'Cam Bergamot'], middle: ['Hương nhang', 'Hổ phách', 'Nhựa Labdanum', 'Opoponax'], base: ['Da thuộc', 'Gỗ trầm hương', 'Gỗ đàn hương', 'Hoắc hương'] }, price: 8500000, desc: 'Biệt danh "Quái vật biển sâu" (The Blue Beast).', analysis: 'Mùi nhang trầm và gia vị cay nóng cuồn cuộn, bám tỏa khủng khiếp, chỉ dành cho những người đàn ông mạnh mẽ nhất.' },

    // Nishane
    { name: 'Hacivat', brand: 'Nishane', cat: 'Niche', fam: 'Woody', gender: 'Unisex', concentration: 'Extrait', longevity: 'Trên 12 tiếng', sillage: 'Rất xa', seasons: ['Xuân', 'Hạ', 'Thu'], timeOfDay: ['Cả ngày'], occasions: ['Đi làm', 'Hằng ngày'], styles: ['Năng động', 'Lạc quan'], targetAge: '25+', ingredients: 'Alcohol, Parfum', notes: { top: ['Dứa', 'Bưởi', 'Cam Bergamot'], middle: ['Gỗ tuyết tùng', 'Hoắc hương', 'Hoa nhài'], base: ['Rêu sồi', 'Gỗ hương bài'] }, price: 5500000, desc: 'Mùi dứa rêu sồi rực rỡ và bền bỉ vô cùng.', analysis: 'Mở đầu với dứa siêu thực, dry down là rêu sồi nam tính, độ bám tỏa cực kỳ đáng sợ.' },

    // Penhaligon's
    { name: 'Halfeti', brand: 'Penhaligon\'s', cat: 'Niche', fam: 'Woody', gender: 'Unisex', concentration: 'EDP', longevity: 'Trên 12 tiếng', sillage: 'Xa', seasons: ['Thu', 'Đông'], timeOfDay: ['Ban đêm'], occasions: ['Hẹn hò', 'Sự kiện'], styles: ['Huyền bí', 'Sang trọng'], targetAge: '30+', ingredients: 'Alcohol, Parfum', notes: { top: ['Lá bách thảo', 'Nghệ tây', 'Thảo quả', 'Ngải cứu', 'Cam Bergamot', 'Bưởi'], middle: ['Hoa hồng Bulgary', 'Nhục đậu khấu', 'Hoa nhài'], base: ['Gỗ trầm hương', 'Da thuộc', 'Gỗ tuyết tùng', 'Gỗ đàn hương', 'Vani', 'Đậu Tonka', 'Xạ hương'] }, price: 7500000, desc: 'Bông hoa hồng đen huyền bí từ Thổ Nhĩ Kỳ.', analysis: 'Hoa hồng sẫm màu kết hợp với gia vị, da thuộc và trầm hương, tạo nên một tuyệt tác phương Đông ma mị.' },

    // Hermès
    { name: 'Terre d\'Hermès EDT', brand: 'Hermès', cat: 'Designer', fam: 'Woody', gender: 'Nam', concentration: 'EDT', longevity: '8-12 tiếng', sillage: 'Vừa phải', seasons: ['Xuân', 'Thu'], timeOfDay: ['Ban ngày'], occasions: ['Đi làm', 'Gặp gỡ đối tác'], styles: ['Trưởng thành', 'Điềm đạm'], targetAge: '30+', ingredients: 'Alcohol, Parfum', notes: { top: ['Cam', 'Bưởi'], middle: ['Tiêu', 'Phong lữ'], base: ['Cỏ hương bài', 'Gỗ tuyết tùng', 'Hoắc hương', 'An tức hương'] }, price: 2800000, desc: 'Mùi hương của người đàn ông phong trần, vững chãi như đất mẹ.', analysis: 'Cam chanh chín mọng quyện cùng tiêu và cỏ hương bài, mùi hương chuẩn mực cho quý ông công sở.' },
  ];

  // Randomize some variants to get to 60 or just keep the distinct 34 for now and clone to hit exactly 60
  // Since you requested exactly 60, I'll generate the remaining by duplicating and slightly altering names/properties.
  while (PERFUMES.length < 60) {
    const template = PERFUMES[Math.floor(Math.random() * 34)];
    const clone = { ...template, name: template.name + ' Edition ' + (PERFUMES.length + 1) };
    PERFUMES.push(clone);
  }

  // Define Note mappings
  const allNotes = Array.from(new Set(
    PERFUMES.flatMap(p => [
      ...p.notes.top.map(n => ({ name: n, type: ScentNoteType.TOP })),
      ...p.notes.middle.map(n => ({ name: n, type: ScentNoteType.MIDDLE })),
      ...p.notes.base.map(n => ({ name: n, type: ScentNoteType.BASE }))
    ])
  ));

  console.log(`Creating ${allNotes.length} scent notes...`);
  // Seed all scent notes first for better performance
  const noteIds = new Map();
  for (const note of allNotes) {
    const created = await prisma.scentNote.upsert({
      where: { name_type: { name: note.name, type: note.type } },
      update: {},
      create: { name: note.name, type: note.type }
    });
    noteIds.set(`${note.name}_${note.type}`, created.id);
  }

  console.log('Creating 60 perfumes...');
  let i = 1;
  for (const p of PERFUMES) {
    const slug = toSlug(p.name) + '-' + Date.now().toString().slice(-4); // ensure unique slug
    
    // Prepare product scent notes
    const productNotes = [
      ...p.notes.top.map(n => ({ noteId: noteIds.get(`${n}_TOP`)! })),
      ...p.notes.middle.map(n => ({ noteId: noteIds.get(`${n}_MIDDLE`)! })),
      ...p.notes.base.map(n => ({ noteId: noteIds.get(`${n}_BASE`)! }))
    ];

    await prisma.product.create({
      data: {
        name: p.name,
        slug: slug,
        brandId: getBrandId(p.brand),
        categoryId: getCatId(p.cat),
        scentFamilyId: getFamId(p.fam),
        description: p.desc,
        gender: p.gender,
        concentration: p.concentration,
        longevity: p.longevity,
        sillage: p.sillage,
        isActive: true,
        isFeatured: Math.random() > 0.5,
        isBestseller: Math.random() > 0.7,
        seasons: p.seasons,
        timeOfDay: p.timeOfDay,
        occasions: p.occasions,
        styles: p.styles,
        targetAge: p.targetAge,
        ingredients: p.ingredients,
        scentAnalysis: p.analysis,
        variants: {
          create: getVariants(p.price)
        },
        notes: {
          create: productNotes
        }
      }
    });

    console.log(`[${i}/60] Created product: ${p.name}`);
    i++;
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
