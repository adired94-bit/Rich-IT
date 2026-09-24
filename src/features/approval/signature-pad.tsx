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

    React.useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        const pad = padRef.current;
        if (!pad || pad.isEmpty()) return null;
        return pad.getTrimmedCanvas().toDataURL("image/png");
      },
      clear: () => padRef.current?.clear(),
    }));

    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border-2 border-dashed border-border-strong bg-white">
          <SignatureCanvas
            ref={padRef}
            penColor="#0b1220"
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
