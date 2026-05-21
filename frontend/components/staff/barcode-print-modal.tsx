'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, Barcode, Minus, Plus, Loader2, Package } from 'lucide-react';
import { barcodeService, type BarcodeLabel } from '@/services/barcode.service';
import { createPortal } from 'react-dom';

/* ────────────────────────── Types ────────────────────────── */

type LabelSize = '40x25' | '50x30' | '60x40';

interface BarcodePrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected variant IDs to print */
  variantIds?: string[];
  /** Or fetch all variants for a product */
  productId?: string;
  /** Or fetch all variants in a store */
  storeId?: string;
  /** Pre-fill quantities for specific variants */
  initialQuantities?: Record<string, number>;
}

/* ────────────────── Label size configs ────────────────── */

const LABEL_SIZES: Record<LabelSize, { w: number; h: number; label: string }> = {
  '40x25': { w: 40, h: 25, label: '40×25 mm' },
  '50x30': { w: 50, h: 30, label: '50×30 mm' },
  '60x40': { w: 60, h: 40, label: '60×40 mm' },
};

/* ────────────────── Helpers ────────────────── */

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ────────────────── Build print HTML ────────────────── */

function buildBarcodePrintHtml(
  labels: BarcodeLabel[],
  quantities: Record<string, number>,
  size: LabelSize,
): string {
  const { w, h } = LABEL_SIZES[size];

  const labelsHtml = labels
    .flatMap((label) => {
      const qty = quantities[label.variantId] || 1;
      return Array.from({ length: qty }, () => label);
    })
    .map(
      (label) => `
      <div class="barcode-label">
        <div class="brand">${escapeHtml(label.brandName)}</div>
        <div class="product-name">${escapeHtml(label.productName)}</div>
        <div class="variant-name">${escapeHtml(label.variantName)}</div>
        <img class="barcode-img" src="${label.barcodeDataUrl}" alt="barcode" />
        <div class="barcode-text">${escapeHtml(label.barcode)}</div>
        <div class="price">${formatVND(label.price)}</div>
        ${label.sku ? `<div class="sku">SKU: ${escapeHtml(label.sku)}</div>` : ''}
      </div>`,
    )
    .join('');

  return `
<style>
@media print {
  @page {
    size: ${w}mm ${h}mm;
    margin: 0;
  }
  body > *:not(#print-mount) { display: none !important; }
  body { margin: 0; padding: 0; background: #fff; }
  #print-mount { display: block !important; }
}
@media screen {
  #print-mount { display: none !important; }
}
.barcode-label {
  width: ${w}mm;
  height: ${h}mm;
  box-sizing: border-box;
  padding: 2.5mm 1.5mm; /* Pushes content inwards from top and bottom */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: Arial, Helvetica, sans-serif;
  color: #000;
  background: #fff;
  page-break-after: always;
  gap: 0.6mm; /* Balanced gap */
  overflow: hidden; /* Prevent spillover */
}
.barcode-label:last-child {
  page-break-after: auto;
}
.barcode-label .brand {
  font-size: ${h <= 25 ? 5 : 6}pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.1;
}
.barcode-label .product-name {
  font-size: ${h <= 25 ? 5.5 : 6.5}pt;
  font-weight: 600;
  line-height: 1.1;
  max-width: ${w - 4}mm;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.barcode-label .variant-name {
  font-size: ${h <= 25 ? 5 : 5.5}pt;
  color: #555;
  line-height: 1.1;
  margin-bottom: 0.5mm;
}
.barcode-label .barcode-img {
  width: ${w - 4}mm;
  height: ${h <= 25 ? 6 : h <= 30 ? 7 : 9}mm;
  object-fit: contain;
  flex-shrink: 0;
}
.barcode-label .barcode-text {
  font-size: ${h <= 25 ? 5 : 6}pt;
  font-family: 'Courier New', monospace;
  letter-spacing: 1.5px;
  line-height: 1;
  margin-bottom: 0.5mm;
  margin-top: -0.2mm;
}
.barcode-label .price {
  font-size: ${h <= 25 ? 6 : 7}pt;
  font-weight: bold;
  line-height: 1.1;
}
.barcode-label .sku {
  font-size: ${h <= 25 ? 4 : 5}pt;
  color: #888;
  line-height: 1;
}
</style>
${labelsHtml}`;
}

/* ────────────────── Component ────────────────── */

export function BarcodePrintModal({
  open,
  onOpenChange,
  variantIds,
  productId,
  storeId,
  initialQuantities,
}: BarcodePrintModalProps) {
  const [labels, setLabels] = useState<BarcodeLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [labelSize, setLabelSize] = useState<LabelSize>('50x30');
  const [printing, setPrinting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch labels when modal opens
  useEffect(() => {
    if (!open) {
      setLabels([]);
      setError(null);
      return;
    }

    const fetchLabels = async () => {
      setLoading(true);
      setError(null);
      try {
        let result: BarcodeLabel[] = [];
        if (variantIds && variantIds.length > 0) {
          result = await barcodeService.getBatchBarcodes(variantIds);
        } else if (productId) {
          result = await barcodeService.getProductBarcodes(productId);
        } else if (storeId) {
          result = await barcodeService.getStoreBarcodes(storeId);
        }
        setLabels(result);
        // Init quantities
        const q: Record<string, number> = {};
        result.forEach((l) => (q[l.variantId] = initialQuantities?.[l.variantId] || 1));
        setQuantities(q);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải mã vạch');
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [open, variantIds, productId, storeId]);

  const setQty = useCallback((variantId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [variantId]: Math.max(1, Math.min(50, (prev[variantId] || 1) + delta)),
    }));
  }, []);

  const totalLabels = labels.reduce((sum, l) => sum + (quantities[l.variantId] || 1), 0);

  const handlePrint = useCallback(() => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(false), 1000);
    }, 400);
  }, []);

  const printHtml = printing
    ? buildBarcodePrintHtml(labels, quantities, labelSize)
    : null;

  return (
    <>
      <Dialog open={open && !printing} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-[2rem] p-0">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-amber-500" />
                In mã vạch sản phẩm
              </DialogTitle>
              <DialogDescription>
                Chọn số lượng tem cần in cho mỗi sản phẩm
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Label size selector */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
                Kích thước tem
              </span>
            </div>
            <div className="flex gap-2">
              {(Object.entries(LABEL_SIZES) as [LabelSize, { w: number; h: number; label: string }][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLabelSize(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      labelSize === key
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-2 overflow-y-auto" style={{ maxHeight: '50vh' }}>
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">Đang tải mã vạch...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center py-12 gap-2">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && labels.length === 0 && (
              <div className="flex flex-col items-center py-12 gap-3">
                <Package className="w-10 h-10 text-gray-300 dark:text-zinc-600" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  Không có sản phẩm nào để in mã vạch
                </p>
              </div>
            )}

            {!loading && labels.length > 0 && (
              <div className="space-y-3">
                {labels.map((label) => (
                  <div
                    key={label.variantId}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
                  >
                    {/* Barcode preview */}
                    <div className="flex-shrink-0 w-28 bg-white rounded-lg p-1.5 border border-gray-200 dark:border-zinc-700">
                      <img
                        src={label.barcodeDataUrl}
                        alt={`Barcode ${label.barcode}`}
                        className="w-full h-10 object-contain"
                      />
                      <p className="text-center text-[9px] font-mono text-gray-500 mt-1">
                        {label.barcode}
                      </p>
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {label.productName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {label.brandName} • {label.variantName}
                      </p>
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                        {formatVND(label.price)}
                      </p>
                      {label.sku && (
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                          SKU: {label.sku}
                        </p>
                      )}
                    </div>

                    {/* Quantity control */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setQty(label.variantId, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums">
                        {quantities[label.variantId] || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(label.variantId, 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {labels.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 rounded-b-[2rem]">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-zinc-400">
                  Tổng: <span className="font-bold text-gray-900 dark:text-white">{totalLabels}</span> tem
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={labels.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Printer className="w-4 h-4" />
                  In {totalLabels} tem
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print portal - mounted directly on document.body during printing */}
      {isMounted && printing && printHtml && typeof document !== 'undefined' &&
        createPortal(
          <div id="print-mount" dangerouslySetInnerHTML={{ __html: printHtml }} />,
          document.body,
        )}
    </>
  );
}
