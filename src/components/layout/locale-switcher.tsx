"use client";
import * as React from "react";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/i18n/locale-actions";
import { locales, type Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";

const labels: Record<Locale, string> = { he: "עברית", ru: "Русский" };

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function onSelect(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={pending}>
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{labels[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => onSelect(l)} className={l === locale ? "text-primary" : undefined}>
            {labels[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
