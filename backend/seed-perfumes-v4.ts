import { PrismaClient, ScentNoteType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- RESETTING DATABASE ---');

    await prisma.cartItem.deleteMany();
    await prisma.appliedPromotion.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.promotionCode.deleteMany();
    await prisma.productScentNote.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.review.deleteMany();
    await prisma.reviewSummary.deleteMany();
    await prisma.product.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.category.deleteMany();
    await prisma.scentNote.deleteMany();
    await prisma.scentFamily.deleteMany();

    console.log('Database cleared.');

    // 1. Seed Brands
    const brandsData = [
        { name: 'Chanel' }, { name: 'Dior' }, { name: 'Tom Ford' }, { name: 'Creed' },
        { name: 'Byredo' }, { name: 'Le Labo' }, { name: 'Jo Malone' }, { name: 'Diptyque' },
        { name: 'Gucci' }, { name: 'Giorgio Armani' }, { name: 'Yves Saint Laurent' },
        { name: 'Parfums de Marly' }, { name: 'Xerjoff' }, { name: 'Maison Francis Kurkdjian' },
        { name: 'Penhaligon\'s' }, { name: 'Kilian Paris' }, { name: 'Amouage' },
        { name: 'Frederic Malle' }, { name: 'Viktor&Rolf' }, { name: 'Prada' }
    ];
    const brands = await Promise.all(brandsData.map(b => prisma.brand.create({ data: b })));
    console.log(`Created ${brands.length} brands.`);

    // 2. Seed Categories
    const categoriesData = [
        { name: 'Floral' }, { name: 'Woody' }, { name: 'Fresh' }, { name: 'Oriental' },
        { name: 'Aromatic' }, { name: 'Gourmand' }, { name: 'Aquatic' }, { name: 'Chypre' }, { name: 'Leather' }
    ];
    const categories = await Promise.all(categoriesData.map(c => prisma.category.create({ data: c })));
    console.log(`Created ${categories.length} categories.`);

    // 3. Seed Scent Notes
    const notesData = [
        { name: 'Bergamot', type: ScentNoteType.TOP },
        { name: 'Lemon', type: ScentNoteType.TOP },
        { name: 'Lavender', type: ScentNoteType.TOP },
        { name: 'Rose', type: ScentNoteType.MIDDLE },
        { name: 'Jasmine', type: ScentNoteType.MIDDLE },
        { name: 'Patchouli', type: ScentNoteType.BASE },
        { name: 'Sandalwood', type: ScentNoteType.BASE },
        { name: 'Vanilla', type: ScentNoteType.BASE },
        { name: 'Amber', type: ScentNoteType.BASE },
        { name: 'Musk', type: ScentNoteType.BASE },
        { name: 'Oud', type: ScentNoteType.BASE },
        { name: 'Cardamom', type: ScentNoteType.MIDDLE }
    ];
    const notes = await Promise.all(notesData.map(n => prisma.scentNote.create({ data: n })));
    console.log(`Created ${notes.length} scent notes.`);

    // 4. Seed 20 Luxury Products
    const productsData = [
        {
            name: 'Bleu de Chanel',
            brand: 'Chanel',
            category: 'Aromatic',
            description: 'A tribute to masculine freedom in an aromatic-woody fragrance with a captivating trail.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '50ml', price: 2800000, stock: 100, sku: 'CHAN-BLEU-50' },
                { name: '100ml', price: 4200000, stock: 50, sku: 'CHAN-BLEU-100' }
            ],
            notes: ['Bergamot', 'Lemon', 'Sandalwood']
        },
        {
            name: 'Sauvage',
            brand: 'Dior',
            category: 'Fresh',
            description: 'A radically fresh composition, dictated by a name that has the ring of a manifesto.',
            concentration: 'Eau de Toilette',
            longevity: 'Moderate',
            variants: [
                { name: '60ml', price: 2400000, stock: 120, sku: 'DIOR-SAUV-60' },
                { name: '100ml', price: 3500000, stock: 80, sku: 'DIOR-SAUV-100' }
            ],
            notes: ['Bergamot', 'Lavender', 'Patchouli']
        },
        {
            name: 'Lost Cherry',
            brand: 'Tom Ford',
            category: 'Oriental',
            description: 'A full-bodied journey into the once-forbidden; a contrasting scent that reveals a tempting dichotomy.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '30ml', price: 4500000, stock: 20, sku: 'TF-LOST-30' },
                { name: '50ml', price: 7200000, stock: 15, sku: 'TF-LOST-50' }
            ],
            notes: ['Rose', 'Jasmine', 'Vanilla']
        },
        {
            name: 'Aventus',
            brand: 'Creed',
            category: 'Chypre',
            description: 'The most popular fragrance ever created in the history of The House of Creed.',
            concentration: 'Eau de Parfum',
            longevity: 'Very Long Lasting',
            variants: [
                { name: '50ml', price: 6500000, stock: 30, sku: 'CREED-AVE-50' },
                { name: '100ml', price: 9500000, stock: 20, sku: 'CREED-AVE-100' }
            ],
            notes: ['Bergamot', 'Patchouli', 'Musk']
        },
        {
            name: 'Baccarat Rouge 540',
            brand: 'Maison Francis Kurkdjian',
            category: 'Oriental',
            description: 'Luminous and sophisticated, it poeticizes the skin like an amber, floral and woody breeze.',
            concentration: 'Extrait de Parfum',
            longevity: 'Eternal',
            variants: [
                { name: '70ml', price: 8500000, stock: 25, sku: 'MFK-BR540-70' },
                { name: '200ml', price: 18000000, stock: 5, sku: 'MFK-BR540-200' }
            ],
            notes: ['Jasmine', 'Amber', 'Musk']
        },
        {
            name: 'Santal 33',
            brand: 'Le Labo',
            category: 'Woody',
            description: 'The ambition to create an olfactive form inspired by the great American myth of the West.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '50ml', price: 5200000, stock: 40, sku: 'LL-SAN33-50' },
                { name: '100ml', price: 8200000, stock: 20, sku: 'LL-SAN33-100' }
            ],
            notes: ['Sandalwood', 'Cardamom', 'Amber']
        },
        {
            name: 'Wood Sage & Sea Salt',
            brand: 'Jo Malone',
            category: 'Aquatic',
            description: 'Escape the everyday along the windswept shore. Waves breaking white, the air fresh with sea salt and spray.',
            concentration: 'Cologne',
            longevity: 'Moderate',
            variants: [
                { name: '30ml', price: 1800000, stock: 60, sku: 'JM-WSSS-30' },
                { name: '100ml', price: 3600000, stock: 30, sku: 'JM-WSSS-100' }
            ],
            notes: ['Bergamot', 'Musk']
        },
        {
            name: 'Oud Wood',
            brand: 'Tom Ford',
            category: 'Woody',
            description: 'One of the most rare, precious, and expensive ingredients in a perfumer’s arsenal.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '50ml', price: 6200000, stock: 35, sku: 'TF-OW-50' },
                { name: '100ml', price: 9200000, stock: 15, sku: 'TF-OW-100' }
            ],
            notes: ['Oud', 'Sandalwood', 'Cardamom']
        },
        {
            name: 'Black Opium',
            brand: 'Yves Saint Laurent',
            category: 'Gourmand',
            description: 'The highly addictive feminine fragrance from Yves Saint Laurent. Fascinating and seductively intoxicating.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '50ml', price: 2600000, stock: 70, sku: 'YSL-BO-50' },
                { name: '90ml', price: 3800000, stock: 40, sku: 'YSL-BO-90' }
            ],
            notes: ['Jasmine', 'Vanilla', 'Patchouli']
        },
        {
            name: 'La Vie Est Belle',
            brand: 'Yves Saint Laurent',
            category: 'Floral',
            description: 'A universal declaration to the beauty of life. A unique olfactory signature perfume scent.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '50ml', price: 2300000, stock: 80, sku: 'LAN-LVEB-50' },
                { name: '100ml', price: 3400000, stock: 50, sku: 'LAN-LVEB-100' }
            ],
            notes: ['Jasmine', 'Vanilla', 'Patchouli']
        },
        {
            name: 'Philosykos',
            brand: 'Diptyque',
            category: 'Woody',
            description: 'An ode to the entire fig tree: the green freshness of the leaves, the density of the white wood.',
            concentration: 'Eau de Parfum',
            longevity: 'Moderate',
            variants: [
                { name: '75ml', price: 4200000, stock: 25, sku: 'DIP-PHIL-75' }
            ],
            notes: ['Bergamot', 'Sandalwood']
        },
        {
            name: 'Black Orchid',
            brand: 'Tom Ford',
            category: 'Oriental',
            description: 'A luxurious and sensual fragrance of rich, dark accords and an alluring potion of black orchids and spice.',
            concentration: 'Eau de Parfum',
            longevity: 'Very Long Lasting',
            variants: [
                { name: '50ml', price: 3800000, stock: 45, sku: 'TF-BO-50' },
                { name: '100ml', price: 5400000, stock: 25, sku: 'TF-BO-100' }
            ],
            notes: ['Bergamot', 'Jasmine', 'Patchouli', 'Vanilla']
        },
        {
            name: 'Delina',
            brand: 'Parfums de Marly',
            category: 'Floral',
            description: 'A floral explosion, a tribute to luminous and sensual femininity.',
            concentration: 'Eau de Parfum',
            longevity: 'Very Long Lasting',
            variants: [
                { name: '75ml', price: 6800000, stock: 20, sku: 'PDM-DEL-75' }
            ],
            notes: ['Bergamot', 'Rose', 'Vanilla', 'Musk']
        },
        {
            name: 'Naxos',
            brand: 'Xerjoff',
            category: 'Aromatic',
            description: 'A celebration of Sicily, a fragrance that captures the essence of the Mediterranean.',
            concentration: 'Eau de Parfum',
            longevity: 'Eternal',
            variants: [
                { name: '100ml', price: 6500000, stock: 15, sku: 'XER-NAX-100' }
            ],
            notes: ['Bergamot', 'Lemon', 'Lavender', 'Vanilla']
        },
        {
            name: 'Halfeti',
            brand: 'Penhaligon\'s',
            category: 'Leather',
            description: 'A mysterious and seductive fragrance inspired by the black roses of Halfeti.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '100ml', price: 5800000, stock: 20, sku: 'PEN-HAL-100' }
            ],
            notes: ['Bergamot', 'Cardamom', 'Rose', 'Oud', 'Patchouli']
        },
        {
            name: 'Good Girl Gone Bad',
            brand: 'Kilian Paris',
            category: 'Floral',
            description: 'A luscious, whirlwind of flowers in the garden of good and evil.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '50ml', price: 6200000, stock: 25, sku: 'KIL-GGGB-50' }
            ],
            notes: ['Rose', 'Jasmine', 'Musk']
        },
        {
            name: 'Reflection Man',
            brand: 'Amouage',
            category: 'Woody',
            description: 'A compelling and distinctive fragrance that embodies the spirit of a refined gentleman.',
            concentration: 'Eau de Parfum',
            longevity: 'Very Long Lasting',
            variants: [
                { name: '100ml', price: 7200000, stock: 15, sku: 'AMO-REF-100' }
            ],
            notes: ['Bergamot', 'Cardamom', 'Jasmine', 'Sandalwood', 'Patchouli']
        },
        {
            name: 'Portrait of a Lady',
            brand: 'Frederic Malle',
            category: 'Oriental',
            description: 'A baroque, sumptuous and symphonic perfume that required hundreds of trials to balance its expressive formula.',
            concentration: 'Eau de Parfum',
            longevity: 'Eternal',
            variants: [
                { name: '50ml', price: 5800000, stock: 10, sku: 'FM-POL-50' },
                { name: '100ml', price: 8800000, stock: 5, sku: 'FM-POL-100' }
            ],
            notes: ['Rose', 'Patchouli', 'Sandalwood', 'Musk']
        },
        {
            name: 'Flowerbomb',
            brand: 'Viktor&Rolf',
            category: 'Floral',
            description: 'An explosive floral bouquet. Addictive and voluptuous, a cascade of flowers that makes everything more positive.',
            concentration: 'Eau de Parfum',
            longevity: 'Long Lasting',
            variants: [
                { name: '50ml', price: 2800000, stock: 50, sku: 'VR-FB-50' },
                { name: '100ml', price: 4200000, stock: 30, sku: 'VR-FB-100' }
            ],
            notes: ['Bergamot', 'Jasmine', 'Rose', 'Patchouli']
        },
        {
            name: 'Luna Rossa Carbon',
            brand: 'Prada',
            category: 'Aromatic',
            description: 'A mineral fragrance, a fougere that brings together steam-distilled botanicals and synthetics in a mineral-forward mix.',
            concentration: 'Eau de Toilette',
            longevity: 'Moderate',
            variants: [
                { name: '50ml', price: 2100000, stock: 40, sku: 'PR-LRC-50' },
                { name: '100ml', price: 3200000, stock: 20, sku: 'PR-LRC-100' }
            ],
            notes: ['Bergamot', 'Lavender', 'Patchouli']
        }
    ];

    for (const p of productsData) {
        const brand = brands.find(b => b.name === p.brand)!;
        const category = categories.find(c => c.name === p.category)!;

        const product = await prisma.product.create({
            data: {
                name: p.name,
                slug: p.name.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'),
                brandId: brand.id,
                categoryId: category.id,
                description: p.description,
                concentration: p.concentration,
                longevity: p.longevity,
                gender: 'Unisex',
                isActive: true,
                variants: {
                    create: p.variants
                }
            }
        });

        // Add Notes
        for (const noteName of p.notes) {
            const note = notes.find(n => n.name === noteName)!;
            await prisma.productScentNote.create({
                data: {
                    productId: product.id,
                    noteId: note.id
                }
            });
        }

        console.log(`Created product: ${p.name}`);
    }

    // 5. Seed Promotion Codes
    const promos = [
        {
            code: 'AURA10',
            description: 'Giảm 10% cho đơn hàng từ 2 triệu',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            minOrderAmount: 2000000,
            maxDiscount: 500000,
            usageLimit: 100,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        {
            code: 'WELCOME500',
            description: 'Giảm 500k cho thành viên mới',
            discountType: 'FIXED_AMOUNT',
            discountValue: 500000,
            minOrderAmount: 5000000,
            usageLimit: 50,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
    ];

    for (const promo of promos) {
        await prisma.promotionCode.create({
            data: promo as any // Using any because of the Enum string mismatch in IDE
        });
        console.log(`Created promotion: ${promo.code}`);
    }

    console.log('--- SEEDING COMPLETE ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
