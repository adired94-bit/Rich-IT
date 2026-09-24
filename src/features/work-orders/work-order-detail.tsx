"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Send, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WorkOrderEditor } from "./work-order-editor";
import { cancelWorkOrderAction, markWorkOrderSentAction } from "@/server/actions/work-orders";
import { formatDate } from "@/lib/utils";
import type { getWorkOrder } from "@/server/queries/work-orders";
import type { Locale } from "@/i18n/config";

type ExistingWorkOrder = NonNullable<Awaited<ReturnType<typeof getWorkOrder>>>;

export function WorkOrderDetail({ workOrder }: { workOrder: ExistingWorkOrder }) {
  const t = useTranslations("workOrders");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = React.useState(false);

  async function handleMarkSent() {
    try {
      await markWorkOrderSentAction(workOrder.id);
      toast.success(tApp("saved"));
      router.refresh();
    } catch {
      toast.error(tApp("error"));
    }
  }

  async function handleCancel() {
    try {
      await cancelWorkOrderAction(workOrder.id);
      toast.success(tApp("saved"));
      setCancelOpen(false);
      router.refresh();
    } catch {
      toast.error(tApp("error"));
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/work-orders" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /> {tApp("back")}
      </Link>

      <div className="glass flex flex-col gap-3 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">{workOrder.number}</h1>
            <Badge variant="outline" className="gap-1">
              <StatusDot status={workOrder.status} /> {t(`statuses.${workOrder.status}`)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link href={`/clients/${workOrder.client.id}`} className="hover:text-primary hover:underline">{workOrder.client.name}</Link>
            {" · "}
            {formatDate(workOrder.date, locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {workOrder.status === "draft" && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleMarkSent}>
              <Send className="h-4 w-4" /> {t("markSent")}
            </Button>
          )}
          {workOrder.status !== "cancelled" && workOrder.status !== "signed" && (
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4" /> {t("cancel")}
            </Button>
          )}
        </div>
      </div>

      <WorkOrderEditor workOrder={workOrder} onSaved={() => router.refresh()} />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tApp("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{tApp("confirmDelete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tApp("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>{t("cancel")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
