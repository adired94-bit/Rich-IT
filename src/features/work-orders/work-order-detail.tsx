"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Send, Ban, Download, MessageCircle, Link2, FileCheck2, FileClock, FilePlus, FileX, Eye, CheckCircle2, Circle, DollarSign, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { cancelWorkOrderAction, markWorkOrderSentAction, toggleWorkOrderCompletedAction, toggleWorkOrderPaidAction } from "@/server/actions/work-orders";
import { formatDateTime, formatMoney, toWhatsAppNumber } from "@/lib/utils";
import type { CompanySettings } from "@/server/queries/settings";
import type { getWorkOrder, listDocumentEvents } from "@/server/queries/work-orders";
import type { DocumentEvent } from "@/db/schema";
import type { Locale } from "@/i18n/config";

type ExistingWorkOrder = NonNullable<Awaited<ReturnType<typeof getWorkOrder>>>;
type EventRow = Awaited<ReturnType<typeof listDocumentEvents>>[number];

const eventIcon: Record<DocumentEvent["event"], React.ElementType> = {
  created: FilePlus,
  sent: Send,
  viewed: Eye,
  signed: FileCheck2,
  cancelled: FileX,
};

export function WorkOrderDetail({
  workOrder,
  events,
  approvalUrl,
  company,
}: {
  workOrder: ExistingWorkOrder;
  events: EventRow[];
  approvalUrl: string;
  company: CompanySettings;
}) {
  const t = useTranslations("workOrders");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;

  const eventLabels: Record<DocumentEvent["event"], string> = {
    created: locale === "ru" ? "Документ создан" : "המסמך נוצר",
    sent: t("statuses.sent"),
    viewed: t("statuses.viewed"),
    signed: t("statuses.signed"),
    cancelled: t("statuses.cancelled"),
  };
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const whatsappNumber = toWhatsAppNumber(workOrder.client.phone);

  // Light polling while the ball is in the client's court, so "viewed"/"signed" show up without a manual refresh.
  React.useEffect(() => {
    if (workOrder.status !== "sent" && workOrder.status !== "viewed") return;
    const interval = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(interval);
  }, [workOrder.status, router]);

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

  async function handleSendWhatsApp() {
    if (workOrder.status === "draft") await handleMarkSent();
    const message = t("whatsappMessage", {
      contact: workOrder.client.contactPerson || workOrder.client.name,
      number: workOrder.number,
      company: company.name,
      total: formatMoney(workOrder.totalAmount, locale),
      link: approvalUrl,
      engineer: workOrder.performerName || company.engineerName || company.name,
    });
    const url = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(approvalUrl);
    toast.success(tApp("copied"));
  }

  async function handleToggleCompleted() {
    try {
      await toggleWorkOrderCompletedAction(workOrder.id, !workOrder.isCompleted);
      toast.success(tApp("saved"));
      router.refresh();
    } catch {
      toast.error(tApp("error"));
    }
  }

  async function handleTogglePaid() {
    try {
      await toggleWorkOrderPaidAction(workOrder.id, !workOrder.isPaid);
      toast.success(tApp("saved"));
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
            {formatDateTime(workOrder.date, locale)}
          </p>
          {workOrder.status === "signed" && workOrder.signedAt && (
            <p className="mt-1 text-xs text-success">{t("signedBy", { name: workOrder.signerName || "" })} · {t("signedAt", { date: formatDateTime(workOrder.signedAt, locale) })}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={`/api/work-orders/${workOrder.id}/pdf`} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> {t("downloadPdf")}
            </a>
          </Button>
          {workOrder.status !== "cancelled" && (
            <Button size="sm" variant="success" className="gap-1.5" onClick={handleSendWhatsApp}>
              <MessageCircle className="h-4 w-4" /> {t("sendWhatsApp")}
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopyLink}>
            <Link2 className="h-4 w-4" /> {t("copyLink")}
          </Button>
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

      {workOrder.status === "signed" && (
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 text-sm font-semibold text-foreground">{t("opsStatus")}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={workOrder.isCompleted ? "success" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={handleToggleCompleted}
              >
                {workOrder.isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {workOrder.isCompleted ? t("completed") : t("notCompleted")}
              </Button>
              <Button
                variant={workOrder.isPaid ? "success" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={handleTogglePaid}
              >
                {workOrder.isPaid ? <DollarSign className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                {workOrder.isPaid ? t("paid") : t("notPaid")}
              </Button>
            </div>
            {workOrder.completedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("completedAt", { date: formatDateTime(workOrder.completedAt, locale) })}
              </p>
            )}
            {workOrder.paidAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("paidAt", { date: formatDateTime(workOrder.paidAt, locale) })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <WorkOrderEditor workOrder={workOrder} company={company} onSaved={() => router.refresh()} />

      {events.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <FileClock className="h-4 w-4 text-primary" /> {t("timeline")}
            </p>
            <ol className="space-y-2">
              {events.map((e) => {
                const Icon = eventIcon[e.event];
                return (
                  <li key={e.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground">{eventLabels[e.event]}</span>
                    <span>· {formatDateTime(e.createdAt, locale)}</span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

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
