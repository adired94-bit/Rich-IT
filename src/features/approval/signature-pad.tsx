"use client";
import * as React from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SignaturePadHandle {
  getDataUrl: () => string | null;
  clear: () => void;
}

export const SignaturePad = React.forwardRef<SignaturePadHandle, { label: string; clearLabel: string }>(
  ({ label, clearLabel }, ref) => {
    const padRef = React.useRef<SignatureCanvas>(null);
    const lastWidthRef = React.useRef(0);

    // The library's default clearOnResize wipes the pad on every window resize.
    // On iPhone, Safari's toolbar collapsing while the signer scrolls down to the
    // "sign" button fires a resize, so the signature vanished before submit.
    // Only re-fit the canvas when its width really changes (rotation), and keep
    // the strokes when we do.
    React.useEffect(() => {
      const canvas = padRef.current?.getCanvas();
      if (canvas) lastWidthRef.current = canvas.offsetWidth;
      function handleResize() {
        const pad = padRef.current;
        if (!pad) return;
        const el = pad.getCanvas();
        if (el.offsetWidth === lastWidthRef.current || el.offsetWidth === 0) return;
        lastWidthRef.current = el.offsetWidth;
        const strokes = pad.toData();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        el.width = el.offsetWidth * ratio;
        el.height = el.offsetHeight * ratio;
        el.getContext("2d")?.scale(ratio, ratio);
        pad.clear();
        if (strokes.length) pad.fromData(strokes);
      }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    React.useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        const pad = padRef.current;
        if (!pad || pad.isEmpty()) return null;
        try {
          // Avoid getTrimmedCanvas(): its cropping step is known to throw on
          // some mobile browsers (notably iOS Safari), which would leave the
          // "sign" button appearing to do nothing since this runs outside
          // the caller's try/catch. Untrimmed whitespace is a fine trade-off.
          return pad.toDataURL("image/png");
        } catch {
          return null;
        }
      },
      clear: () => padRef.current?.clear(),
    }));

    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border-2 border-dashed border-border-strong bg-white">
          <SignatureCanvas
            ref={padRef}
            penColor="#0b1220"
            clearOnResize={false}
            canvasProps={{ className: "w-full h-40 touch-none" }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => padRef.current?.clear()}>
            <Eraser className="h-3.5 w-3.5" /> {clearLabel}
          </Button>
        </div>
      </div>
    );
  },
);
SignaturePad.displayName = "SignaturePad";
