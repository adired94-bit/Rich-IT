"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserPlus, Mic, FilePlus2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

export function QuickActions() {
  const t = useTranslations("dashboard");
  const openQuickRecord = useUiStore((s) => s.openQuickRecord);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button variant="outline" className="h-16 flex-col gap-1.5" asChild>
        <Link href="/clients/new">
          <UserPlus className="h-4.5 w-4.5" />
          <span className="text-xs">{t("newClient")}</span>
        </Link>
      </Button>
      <Button variant="voice" className="h-16 flex-col gap-1.5" onClick={() => openQuickRecord()}>
        <Mic className="h-4.5 w-4.5" />
        <span className="text-xs">{t("quickRecord")}</span>
      </Button>
      <Button variant="outline" className="h-16 flex-col gap-1.5" asChild>
        <Link href="/work-orders/new">
          <FilePlus2 className="h-4.5 w-4.5" />
          <span className="text-xs">{t("newWorkOrder")}</span>
        </Link>
      </Button>
      <Button variant="outline" className="h-16 flex-col gap-1.5" asChild>
        <Link href="/calendar">
          <CalendarPlus className="h-4.5 w-4.5" />
          <span className="text-xs">{t("newEvent")}</span>
        </Link>
      </Button>
    </div>
  );
}
