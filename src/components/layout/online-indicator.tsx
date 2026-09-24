"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function OnlineIndicator() {
  const t = useTranslations("app");
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <span
      className={cn(
        "hidden md:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        online ? "border-success/30 bg-success-soft text-success" : "border-warning/30 bg-warning-soft text-warning",
      )}
      title={online ? t("online") : t("offline")}
    >
      <span className={cn("status-dot", online ? "bg-success text-success" : "bg-warning text-warning")} />
      {online ? t("online") : t("offline")}
    </span>
  );
}
