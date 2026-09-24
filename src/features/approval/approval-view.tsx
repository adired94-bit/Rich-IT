"use client";
import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";
import { markWorkOrderViewedAction, signWorkOrderAction } from "@/server/actions/approval";
import { DOC_LABELS, type DocLang } from "@/lib/pdf/labels";
import { company } from "@/config/company";
import type { getWorkOrderByApprovalToken } from "@/server/queries/work-orders";

type WorkOrderData = NonNullable<Awaited<ReturnType<typeof getWorkOrderByApprovalToken>>>;

const UI = {
  he: {
    subtitle: "אנא עברו על פירוט העבודה והמחירים, ואשרו בחתימה דיגיטלית.",
    signHere: "חתמו כאן", clear: "ניקוי", signerName: "שם החותם", approve: "אשר וחתום", signing: "שולח...",
    signed: "המסמך נחתם בהצלחה", signedMessage: "תודה! עותק חתום נשמר במערכת.", alreadySigned: "המסמך כבר נחתם",
    notFound: "המסמך לא נמצא", cancelled: "דף השירות בוטל", terms: DOC_LABELS.he.termsText,
    downloadPdf: "הורדת PDF", signatureRequired: "נדרשת חתימה", nameRequired: "נדרש שם החותם",
  },
  ru: {
    subtitle: "Проверьте перечень работ и цены и подтвердите цифровой подписью.",
    signHere: "Подпишите здесь", clear: "Очистить", signerName: "Имя подписавшего", approve: "Подтвердить и подписать", signing: "Отправка...",
    signed: "Документ успешно подписан", signedMessage: "Спасибо! Подписанная копия сохранена в системе.", alreadySigned: "Документ уже подписан",
    notFound: "Документ не найден", cancelled: "Акт отменён", terms: DOC_LABELS.ru.termsText,
    downloadPdf: "Скачать PDF", signatureRequired: "Требуется подпись", nameRequired: "Укажите имя подписавшего",
  },
} as const;

function fmtMoney(n: number, lang: DocLang) {
  return new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
}
function fmtDate(d: Date | string, lang: DocLang) {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "he-IL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export function ApprovalView({ workOrder, token }: { workOrder: WorkOrderData; token: string }) {
  const lang: DocLang = workOrder.language === "ru" ? "ru" : "he";
  const t = UI[lang];
  const doc = DOC_LABELS[lang];
  const dir = lang === "ru" ? "ltr" : "rtl";
  const isRtl = dir === "rtl";

  const [status, setStatus] = React.useState(workOrder.status);
  const [signerName, setSignerName] = React.useState(workOrder.client.contactPerson ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const padRef = React.useRef<SignaturePadHandle>(null);
  const viewedRef = React.useRef(false);

  React.useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    markWorkOrderViewedAction(token).then(() => {
      setStatus((s) => (s === "sent" ? "viewed" : s));
    });
  }, [token]);

  async function handleSign() {
    const dataUrl = padRef.current?.getDataUrl();
    if (!dataUrl) {
      toast.error(t.signatureRequired);
      return;
    }
    if (!signerName.trim()) {
      toast.error(t.nameRequired);
      return;
    }
    setSubmitting(true);
    try {
      const res = await signWorkOrderAction(token, signerName.trim(), dataUrl);
      if (res.ok) {
        setStatus("signed");
        toast.success(t.signed);
      } else {
        toast.error(t.notFound);
      }
    } catch {
      toast.error(t.notFound);
    } finally {
      setSubmitting(false);
    }
  }

  const pdfUrl = `/api/approve/${token}/pdf`;

  if (status === "cancelled") {
    return (
      <StatusScreen dir={dir} icon={<XCircle className="h-10 w-10 text-destructive" />} title={t.cancelled} />
    );
  }

  return (
    <div dir={dir} className="min-h-dvh grid-bg px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image src="/icons/icon-96.png" alt="" width={48} height={48} className="rounded-xl shadow-glow" />
          <h1 className="text-lg font-bold text-foreground">{company.name}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className={`flex flex-wrap items-start justify-between gap-2`}>
              <div>
                <p className="text-base font-bold text-foreground">{doc.title}</p>
                <p className="text-xs text-muted-foreground">{doc.docNumber} {workOrder.number} · {fmtDate(workOrder.date, lang)}</p>
              </div>
              <Badge variant="outline">{workOrder.client.name}</Badge>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-xs text-muted-foreground">
                    <th className={`px-2 py-2 font-medium ${isRtl ? "text-right" : "text-left"}`}>{doc.description}</th>
                    <th className="px-2 py-2 text-center font-medium">{doc.qty}</th>
                    <th className="px-2 py-2 text-center font-medium">{doc.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className={`px-2 py-2 ${isRtl ? "text-right" : "text-left"}`}>{lang === "ru" ? item.descriptionRu || item.description : item.description}</td>
                      <td className="px-2 py-2 text-center text-xs text-muted-foreground">{item.quantity} {item.unit}</td>
                      <td className="px-2 py-2 text-center font-medium text-telemetry">{fmtMoney(Math.max(0, item.quantity * item.unitPrice - item.discount), lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ms-auto w-full max-w-56 space-y-1 text-sm">
              <Row label={doc.subtotal} value={fmtMoney(workOrder.subtotal, lang)} />
              {workOrder.discount > 0 && <Row label={doc.discount} value={`-${fmtMoney(workOrder.discount, lang)}`} />}
              <Row label={doc.vat(workOrder.vatRate)} value={fmtMoney(workOrder.vatAmount, lang)} />
              <Row label={doc.grandTotal} value={fmtMoney(workOrder.totalAmount, lang)} bold />
            </div>

            {workOrder.summary && (
              <div>
                <p className="text-xs font-semibold text-foreground">{doc.summary}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{workOrder.summary}</p>
              </div>
            )}

            <p className="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground">{t.terms}</p>

            <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" /> {t.downloadPdf}
              </a>
            </Button>
          </CardContent>
        </Card>

        {status === "signed" ? (
          <StatusScreen
            dir={dir}
            icon={<CheckCircle2 className="h-10 w-10 text-success" />}
            title={t.signed}
            subtitle={workOrder.signerName ? `${t.signedMessage} (${workOrder.signerName})` : t.signedMessage}
          />
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div>
                <Label>{t.signerName}</Label>
                <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} required />
              </div>
              <div>
                <SignaturePad ref={padRef} label={t.signHere} clearLabel={t.clear} />
              </div>
              <Button className="w-full gap-1.5" size="lg" onClick={handleSign} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? t.signing : t.approve}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "border-t border-border pt-1.5 font-bold text-primary" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="text-telemetry">{value}</span>
    </div>
  );
}

function StatusScreen({ dir, icon, title, subtitle }: { dir: "rtl" | "ltr"; icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div dir={dir} className="grid min-h-[40vh] place-items-center px-4">
      <div className="glass flex flex-col items-center gap-3 rounded-xl p-8 text-center">
        {icon}
        <p className="text-base font-semibold text-foreground">{title}</p>
        {subtitle && <p className="max-w-sm text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
