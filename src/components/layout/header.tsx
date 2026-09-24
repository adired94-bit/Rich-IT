"use client";
import { useTranslations } from "next-intl";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { OnlineIndicator } from "./online-indicator";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { useUiStore } from "@/stores/ui-store";

export function Header({ email }: { email?: string | null }) {
  const t = useTranslations("nav");
  const openQuickRecord = useUiStore((s) => s.openQuickRecord);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <MobileNav />
      <div className="flex-1" />
      <OnlineIndicator />
      <Button variant="voice" size="sm" className="gap-1.5" onClick={() => openQuickRecord()}>
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline">{t("quickRecord")}</span>
      </Button>
      <LocaleSwitcher />
      <ThemeToggle />
      <UserMenu email={email} />
    </header>
  );
}
