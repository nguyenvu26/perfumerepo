import { StaffPosService } from './staff-pos.service';

describe('StaffPosService (barcode)', () => {
  let service: StaffPosService;
  let prisma: {
    productVariant: { findFirst: jest.Mock };
    product: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      productVariant: { findFirst: jest.fn() },
      product: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new StaffPosService(prisma as any, {} as any, {} as any, {} as any);
  });

  it('searchProductsByBarcode returns [] for blank barcode', async () => {
    await expect(service.searchProductsByBarcode('', 's1')).resolves.toEqual(
      [],
    );
    await expect(service.searchProductsByBarcode('   ', 's1')).resolves.toEqual(
      [],
    );
    expect(prisma.productVariant.findFirst).not.toHaveBeenCalled();
  });

  it('searchProductsByBarcode queries variant and loads product', async () => {
    prisma.productVariant.findFirst.mockResolvedValue({ productId: 'prod-1' });
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-1', name: 'Test', variants: [] },
    ]);

    const out = await service.searchProductsByBarcode('5901234123457', 'store-a');

    expect(out).toHaveLength(1);
    expect(prisma.productVariant.findFirst).toHaveBeenCalledWith({
      where: {
        barcode: '5901234123457',
        isActive: true,
        storeStocks: {
          some: { storeId: 'store-a', quantity: { gt: 0 } },
        },
      },
      select: { productId: true },
    });
    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  it('searchProductsByBarcode returns [] when variant not found', async () => {
    prisma.productVariant.findFirst.mockResolvedValue(null);
    const out = await service.searchProductsByBarcode('unknown', 's1');
    expect(out).toEqual([]);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });
});
