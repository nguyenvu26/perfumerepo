"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (text: string) => void;
  onError?: (message: string) => void;
  title: string;
  description: string;
};

/**
 * Live barcode scanning via device camera (ZXing). Stops the stream after a successful read or when closed.
 */
export function PosBarcodeCameraDialog({
  open,
  onOpenChange,
  onDetected,
  onError,
  title,
  description,
}: Props) {
  const [manualCode, setManualCode] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const onDetectedRef = useRef(onDetected);
  const onOpenChangeRef = useRef(onOpenChange);
  onDetectedRef.current = onDetected;
  onOpenChangeRef.current = onOpenChange;

  const stopScan = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* stream may already be stopped */
    }
    controlsRef.current = null;
  }, []);

  const submitManual = useCallback(() => {
    const code = manualCode.trim();
    if (!code) return;
    try {
      stopScan();
    } catch {}
    onDetectedRef.current(code);
    onOpenChangeRef.current(false);
    setManualCode("");
  }, [manualCode, stopScan]);

  useEffect(() => {
    if (!open) {
      stopScan();
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled || !videoRef.current) return;

        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, _err, ctls) => {
            if (!result) return;
            const text = result.getText().trim();
            if (!text) return;
            try {
              ctls.stop();
            } catch {
              /* noop */
            }
            controlsRef.current = null;
            onDetectedRef.current(text);
            onOpenChangeRef.current(false);
          },
        );
        if (!cancelled) controlsRef.current = controls;
      } catch (e) {
        console.error("Barcode camera failed", e);
        onError?.("CAMERA_SCAN_FAILED");
      }
    })();

    return () => {
      cancelled = true;
      stopScan();
    };
  }, [open, stopScan]);

  // autofocus manual input when dialog opens
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      try {
        inputRef.current?.focus();
      } catch {}
    }, 250);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) stopScan();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg p-6 rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <video
          ref={videoRef}
          className="w-full rounded-2xl bg-black aspect-video object-cover"
          playsInline
          muted
          autoPlay
        />
        <div className="mt-4">
          <label className="sr-only">Enter barcode</label>
          <input
            ref={inputRef}
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitManual();
              }
            }}
            placeholder="Nhập mã vạch"
            className="w-full px-4 py-3 rounded-lg border bg-white text-black"
          />
          <button
            type="button"
            onClick={() => submitManual()}
            className="mt-3 w-full inline-flex justify-center items-center rounded-lg bg-amber-500 text-white px-4 py-2"
          >
            Tìm & thêm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
