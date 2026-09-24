"use client";
import { cn } from "@/lib/utils";

export function Waveform({ levels, active, className }: { levels: number[]; active: boolean; className?: string }) {
  return (
    <div className={cn("flex h-16 items-center justify-center gap-[3px]", className)}>
      {levels.map((v, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-full transition-[height] duration-100 ease-out", active ? "bg-voice" : "bg-border-strong")}
          style={{ height: `${Math.max(8, v * 100)}%` }}
        />
      ))}
    </div>
  );
}
