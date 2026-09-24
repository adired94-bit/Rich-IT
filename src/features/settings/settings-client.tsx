"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bell, BellOff, Building2, Cable, Copy, Download, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { seedCatalogAction } from "@/server/actions/catalog";
import { subscribePushAction, unsubscribePushAction } from "@/server/actions/push";
import { isPushSupported, getExistingPushSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import { company } from "@/config/company";

interface Status {
  supabase: boolean;
  database: boolean;
  anthropic: boolean;
  openai: boolean;
  vault: boolean;
  push: boolean;
}

export function SettingsClient({ status, icsUrl, vapidPublicKey }: { status: Status; icsUrl: string; vapidPublicKey: string }) {
  const t = useTranslations("settings");
  const tApp = useTranslations("app");
  const [seeding, setSeeding] = React.useState(false);
  const [pushEnabled, setPushEnabled] = React.useState(false);
  const [pushLoading, setPushLoading] = React.useState(false);
  const [installPromptAvailable, setInstallPromptAvailable] = React.useState(false);
  const deferredPrompt = React.useRef<{ prompt: () => void } | null>(null);

  React.useEffect(() => {
    if (!isPushSupported()) return;
    getExistingPushSubscription().then((sub) => setPushEnabled(Boolean(sub)));
  }, []);

  React.useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      deferredPrompt.current = e as unknown as { prompt: () => void };
      setInstallPromptAvailable(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleTogglePush(enabled: boolean) {
    setPushLoading(true);
    try {
      if (enabled) {
        const sub = await subscribeToPush(vapidPublicKey);
        await subscribePushAction(sub.toJSON(), navigator.userAgent);
        setPushEnabled(true);
        toast.success(t("pushEnabled"));
      } else {
        const endpoint = await unsubscribeFromPush();
        if (endpoint) await unsubscribePushAction(endpoint);
        setPushEnabled(false);
      }
    } catch {
      toast.error(tApp("error"));
    } finally {
      setPushLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await seedCatalogAction();
      toast.success(`${t("seedCatalog")} (+${res.inserted})`);
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSeeding(false);
    }
  }

  async function copyIcs() {
    await navigator.clipboard.writeText(icsUrl);
    toast.success(tApp("copied"));
  }

  const statusRows: { label: string; ok: boolean }[] = [
    { label: "Supabase", ok: status.supabase },
    { label: "Database (Postgres)", ok: status.database },
    { label: "Anthropic (Claude)", ok: status.anthropic },
    { label: "OpenAI (Whisper)", ok: status.openai },
    { label: "Vault encryption key", ok: status.vault },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-primary" /> {t("company")}
          </p>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="Name" value={company.name} />
            <Row label="Engineer" value={company.engineerName || "—"} />
            <Row label="Phone" value={company.phone || "—"} />
            <Row label="Email" value={company.email || "—"} />
            <Row label="Address" value={company.address || "—"} />
            <Row label="VAT ID" value={company.vatId || "—"} />
          </dl>
          <p className="mt-3 text-[11px] text-muted-foreground">{t("envHint")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Cable className="h-4 w-4 text-primary" /> {t("integrations")}
          </p>
          <div className="space-y-2">
            {statusRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <Badge variant={row.ok ? "success" : "destructive"}>{row.ok ? t("configured") : t("missing")}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> {t("pwa")}
          </p>
          <p className="text-xs text-muted-foreground">{t("installHint")}</p>
          {installPromptAvailable && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => deferredPrompt.current?.prompt()}
            >
              <Download className="h-4 w-4" /> {tApp("install")}
            </Button>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              {pushEnabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
              <div>
                <p className="text-sm text-foreground">{t("pushEnable")}</p>
                {!isPushSupported() && <p className="text-[11px] text-warning">{t("pushUnsupported")}</p>}
                {isPushSupported() && !status.push && <p className="text-[11px] text-warning">{t("missing")}: VAPID keys</p>}
              </div>
            </div>
            {pushLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch checked={pushEnabled} disabled={!isPushSupported() || !status.push} onCheckedChange={handleTogglePush} />
            )}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("icsFeed")}</p>
            <div className="flex gap-2">
              <Input readOnly dir="ltr" value={icsUrl} onFocus={(e) => e.currentTarget.select()} />
              <Button variant="outline" onClick={copyIcs} className="shrink-0 gap-1.5">
                <Copy className="h-4 w-4" /> {tApp("copy")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("seedCatalog")}</p>
            <p className="text-xs text-muted-foreground">{t("seedCatalogHint")}</p>
          </div>
          <Button variant="outline" onClick={handleSeed} disabled={seeding} className="shrink-0 gap-1.5">
            {seeding && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("seedCatalog")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 sm:border-0 sm:py-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
