export interface ScentPersona {
  name: string;
  archetype: string;
  description: string;
  traits: string[];
  vibeTags: string[];
}

export function analyzeScentPersona(
  preferredNotes: string[],
  riskLevel: number
): ScentPersona {
  const notes = preferredNotes.map(n => n.toLowerCase());
  
  // Note Groups
  const freshNotes = ['chanh', 'citrus', 'cam', 'quýt', 'bưởi', 'lemon', 'bergamot', 'marine', 'sea', 'ocean', 'tươi mát'];
  const floralNotes = ['hoa', 'rose', 'jasmine', 'lily', 'nhài', 'hồng', 'lavender', 'floral', 'violet', 'mẫu đơn'];
  const woodyNotes = ['gỗ', 'sandalwood', 'cedarwood', 'oakmoss', 'trầm', 'đàn hương', 'thông', 'pine', 'vetiver'];
  const spicyNotes = ['tiêu', 'pepper', 'quế', 'cinnamon', 'gừng', 'ginger', 'cay', 'clove', 'nhục đậu khấu'];
  const sweetNotes = ['vân anh', 'vanilla', 'ngọt', 'sweet', 'caramel', 'chocolate', 'honey', 'mật ong', 'amber', 'hổ phách'];

  const score = {
    fresh: notes.filter(n => freshNotes.some(f => n.includes(f))).length,
    floral: notes.filter(n => floralNotes.some(f => n.includes(f))).length,
    woody: notes.filter(n => woodyNotes.some(f => n.includes(f))).length,
    spicy: notes.filter(n => spicyNotes.some(f => n.includes(f))).length,
    sweet: notes.filter(n => sweetNotes.some(f => n.includes(f))).length,
  };

  const dominant = Object.entries(score).reduce((a, b) => (a[1] > b[1] ? a : b))[0];

  if (riskLevel > 0.7) {
    if (dominant === 'woody' || dominant === 'spicy') {
      return {
        name: "The Bold Pioneer",
        archetype: "Người Tiên Phong Táo Bạo",
        description: "Bạn sở hữu một DNA mùi hương mạnh mẽ và đầy bản lĩnh. Bạn không ngại thử thách với những nốt hương gai góc, nồng cháy, phản ánh một cá tính độc lập và luôn muốn dẫn đầu xu hướng.",
        traits: ["Quyết đoán", "Cá tính mạnh", "Thích khám phá"],
        vibeTags: ["Gợi cảm", "Bí ẩn", "Quyền lực"]
      };
    }
    return {
      name: "The Mysterious Alchemist",
      archetype: "Nhà Giả Kim Bí Ẩn",
      description: "DNA của bạn là sự pha trộn giữa sự tò mò và chiều sâu. Bạn thích những mùi hương phức tạp, có khả năng biến hóa theo thời gian, tạo nên một sức hút khó cưỡng và đầy mê hoặc.",
      traits: ["Sáng tạo", "Sâu sắc", "Phức tạp"],
      vibeTags: ["Khác biệt", "Nghệ thuật", "Lôi cuốn"]
    };
  }

  if (riskLevel < 0.35) {
    if (dominant === 'fresh' || dominant === 'floral') {
      return {
        name: "The Pure Minimalist",
        archetype: "Người Tối Giản Thuần Khiết",
        description: "Bạn yêu thích sự tinh tế đến từ những điều đơn giản nhất. DNA mùi hương của bạn tỏa ra năng lượng tích cực, sự sạch sẽ và một tâm hồn nhẹ nhàng, yêu tự do.",
        traits: ["Tinh tế", "Gần gũi", "Lạc quan"],
        vibeTags: ["Thanh khiết", "Tự nhiên", "Nhẹ nhàng"]
      };
    }
    return {
      name: "The Classic Romantic",
      archetype: "Tâm Hồn Lãng Mạn Cổ Điển",
      description: "DNA của bạn gắn liền với những giá trị vượt thời gian. Bạn trân trọng sự lãng mạn, thanh lịch và luôn tỏa ra một sức hút dịu dàng nhưng đầy vương vấn.",
      traits: ["Nhạy cảm", "Thanh lịch", "Chân thành"],
      vibeTags: ["Cổ điển", "Sang trọng", "Ấm áp"]
    };
  }

  // Default / Balanced
  return {
    name: "The Elegant Sophisticate",
    archetype: "Người Sành Điệu Thanh Lịch",
    description: "Bạn có một gu thẩm mỹ cân bằng và hiện đại. DNA mùi hương của bạn là sự giao thoa hoàn hảo giữa phong cách cổ điển và hơi thở thời đại, phù hợp cho mọi hoàn cảnh.",
    traits: ["Tự tin", "Cân bằng", "Linh hoạt"],
    vibeTags: ["Chuyên nghiệp", "Hiện đại", "Hài hòa"]
  };
}
