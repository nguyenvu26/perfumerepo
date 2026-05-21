import api from '@/lib/axios';

export type BarcodeLabel = {
  variantId: string;
  productName: string;
  variantName: string;
  brandName: string;
  sku: string | null;
  barcode: string;
  price: number;
  barcodeDataUrl: string;
};

export const barcodeService = {
  /** Get barcode label for a single variant */
  getVariantBarcode(variantId: string): Promise<BarcodeLabel | null> {
    return api.get<BarcodeLabel>(`/barcode/variant/${variantId}`).then((r) => r.data);
  },

  /** Get barcode labels for multiple variants */
  getBatchBarcodes(variantIds: string[]): Promise<BarcodeLabel[]> {
    return api.post<BarcodeLabel[]>('/barcode/batch', { variantIds }).then((r) => r.data);
  },

  /** Get barcode labels for all variants of a product */
  getProductBarcodes(productId: string): Promise<BarcodeLabel[]> {
    return api.get<BarcodeLabel[]>(`/barcode/product/${productId}`).then((r) => r.data);
  },

  /** Get barcode labels for all variants in a store's inventory */
  getStoreBarcodes(storeId: string): Promise<BarcodeLabel[]> {
    return api.get<BarcodeLabel[]>(`/barcode/store/${storeId}`).then((r) => r.data);
  },
};
