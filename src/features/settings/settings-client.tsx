"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bell, BellOff, Building2, Cable, Copy, Download, KeyRound, Loader2, Pencil, PenLine, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { seedCatalogAction } from "@/server/actions/catalog";
import { subscribePushAction, unsubscribePushAction } from "@/server/actions/push";
import {
  updateCompanySettingsAction,
  verifyPasswordAction,
  updateAiKeysAction,
  clearAiKeysAction,
  updateOwnerSignatureAction,
  clearOwnerSignatureAction,
} from "@/server/actions/settings";
import { isPushSupported, getExistingPushSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import { SignaturePad, type SignaturePadHandle } from "@/features/approval/signature-pad";
import type { CompanySettings } from "@/server/queries/settings";

interface Status {
  supabase: boolean;
  database: boolean;
  vault: boolean;
  push: boolean;
}

interface AiKeysStatus {
  anthropicConfigured: boolean;
  anthropicMasked: string | null;
  anthropicSource: "app" | "env" | null;
  openaiConfigured: boolean;
  openaiMasked: string | null;
  openaiSource: "app" | "env" | null;
  claudeModel: string;
  whisperModel: string;
}

export function SettingsClient({
  status,
  company,
  aiKeysStatus,
  icsUrl,
  vapidPublicKey,
}: {
  status: Status;
  company: CompanySettings;
  aiKeysStatus: AiKeysStatus;
  icsUrl: string;
  vapidPublicKey: string;
}) {
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
    { label: "Vault encryption key", ok: status.vault },
  ];

  return (
    <div className="space-y-4">
      <CompanyCard company={company} />

      <SignatureCard initialSignatureUrl={company.ownerSignatureUrl} />

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
          <p className="mt-3 text-[11px] text-muted-foreground">{t("envHint")}</p>
        </CardContent>
      </Card>

      <AiKeysCard status={aiKeysStatus} />

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

/* ------------------------------ Company details (editable) ------------------------------ */

function CompanyCard({ company }: { company: CompanySettings }) {
  const t = useTranslations("settings");
  const tApp = useTranslations("app");
  const [form, setForm] = React.useState({
    name: company.name,
    phone: company.phone,
    email: company.email,
    address: company.address,
    vatId: company.vatId,
    website: company.website,
    engineerName: company.engineerName,
    defaultVatRate: String(Math.round(company.defaultVatRate * 100)),
  });
  const [saving, setSaving] = React.useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateCompanySettingsAction({
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        vatId: form.vatId,
        website: form.website,
        engineerName: form.engineerName,
        defaultVatRate: Math.max(0, Math.min(100, Number(form.defaultVatRate) || 0)) / 100,
      });
      toast.success(tApp("saved"));
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Building2 className="h-4 w-4 text-primary" /> {t("company")}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("fields.name")}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={t("fields.engineerName")}>
            <Input value={form.engineerName} onChange={(e) => set("engineerName", e.target.value)} />
          </Field>
          <Field label={t("fields.phone")}>
            <Input dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label={t("fields.email")}>
            <Input dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label={t("fields.address")} className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label={t("fields.vatId")}>
            <Input dir="ltr" value={form.vatId} onChange={(e) => set("vatId", e.target.value)} />
          </Field>
          <Field label={t("fields.website")}>
            <Input dir="ltr" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label={t("fields.defaultVatRate")}>
            <Input dir="ltr" type="number" min={0} max={100} value={form.defaultVatRate} onChange={(e) => set("defaultVatRate", e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {tApp("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* ------------------------------ Owner signature ------------------------------ */

function SignatureCard({ initialSignatureUrl }: { initialSignatureUrl: string | null }) {
  const t = useTranslations("settings");
  const tApp = useTranslations("app");
  const [signatureUrl, setSignatureUrl] = React.useState(initialSignatureUrl);
  const [editing, setEditing] = React.useState(!initialSignatureUrl);
  const [saving, setSaving] = React.useState(false);
  const padRef = React.useRef<SignaturePadHandle>(null);

  async function handleSave() {
    const dataUrl = padRef.current?.getDataUrl();
    if (!dataUrl) {
      toast.error(t("signatureRequired"));
      return;
    }
    setSaving(true);
    try {
      await updateOwnerSignatureAction(dataUrl);
      setSignatureUrl(dataUrl);
      setEditing(false);
      toast.success(tApp("saved"));
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    try {
      await clearOwnerSignatureAction();
      setSignatureUrl(null);
      setEditing(true);
      toast.success(tApp("deleted"));
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <PenLine className="h-4 w-4 text-primary" /> {t("mySignature")}
          </p>
          {!editing && signatureUrl && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> {tApp("edit")}
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{t("mySignatureHint")}</p>

        {!editing && signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a saved data: URL, not an optimizable remote image
          <img src={signatureUrl} alt="" className="h-20 rounded-lg border border-border bg-white object-contain px-3" />
        ) : (
          <div className="space-y-2">
            <SignaturePad ref={padRef} label={t("signHere")} clearLabel={tApp("cancel")} />
            <div className="flex justify-end gap-2">
              {signatureUrl && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                  {tApp("cancel")}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={handleClear} disabled={saving}>
                <Trash2 className="h-3.5 w-3.5" /> {tApp("delete")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {tApp("save")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ AI keys (password gated) ------------------------------ */

function AiKeysCard({ status }: { status: AiKeysStatus }) {
  const t = useTranslations("settings");
  const tApp = useTranslations("app");
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);
  const [form, setForm] = React.useState({
    anthropicApiKey: "",
    openaiApiKey: "",
    claudeModel: status.claudeModel,
    whisperModel: status.whisperModel,
  });
  const [saving, setSaving] = React.useState(false);

  function openPasswordPrompt() {
    setPassword("");
    setPasswordError(false);
    setPasswordOpen(true);
  }

  async function handleVerify() {
    setVerifying(true);
    setPasswordError(false);
    try {
      const res = await verifyPasswordAction(password);
      if (!res.ok) {
        setPasswordError(true);
        return;
      }
      setForm({ anthropicApiKey: "", openaiApiKey: "", claudeModel: status.claudeModel, whisperModel: status.whisperModel });
      setPasswordOpen(false);
      setEditOpen(true);
    } finally {
      setVerifying(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      await updateAiKeysAction(password, {
        anthropicApiKey: form.anthropicApiKey,
        openaiApiKey: form.openaiApiKey,
        claudeModel: form.claudeModel,
        whisperModel: form.whisperModel,
      });
      toast.success(tApp("saved"));
      setEditOpen(false);
      setPassword("");
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    try {
      await clearAiKeysAction(password);
      toast.success(tApp("deleted"));
      setEditOpen(false);
      setPassword("");
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" /> {t("aiKeys")}
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openPasswordPrompt}>
            <Pencil className="h-3.5 w-3.5" /> {tApp("edit")}
          </Button>
        </div>
        <div className="space-y-2">
          <KeyRow label="Anthropic (Claude)" configured={status.anthropicConfigured} masked={status.anthropicMasked} />
          <KeyRow label="OpenAI (Whisper)" configured={status.openaiConfigured} masked={status.openaiMasked} />
        </div>
        <p className="text-[11px] text-muted-foreground">{t("aiKeysHint")}</p>
      </CardContent>

      {/* Step 1: confirm identity */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("confirmPassword")}</DialogTitle>
            <DialogDescription>{t("confirmPasswordHint")}</DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            autoFocus
          />
          {passwordError && <p className="text-xs text-destructive">{t("wrongPassword")}</p>}
          <DialogFooter>
            <Button onClick={handleVerify} disabled={verifying || !password} className="gap-1.5">
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              {tApp("continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: edit + publish */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("aiKeys")}</DialogTitle>
            <DialogDescription>{t("aiKeysEditHint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Anthropic API key">
              <Input
                dir="ltr"
                placeholder={status.anthropicMasked ?? "sk-ant-..."}
                value={form.anthropicApiKey}
                onChange={(e) => setForm((f) => ({ ...f, anthropicApiKey: e.target.value }))}
              />
            </Field>
            <Field label="OpenAI API key">
              <Input
                dir="ltr"
                placeholder={status.openaiMasked ?? "sk-..."}
                value={form.openaiApiKey}
                onChange={(e) => setForm((f) => ({ ...f, openaiApiKey: e.target.value }))}
              />
            </Field>
            <Field label="Claude model">
              <Input dir="ltr" value={form.claudeModel} onChange={(e) => setForm((f) => ({ ...f, claudeModel: e.target.value }))} />
            </Field>
            <Field label="Whisper model">
              <Input dir="ltr" value={form.whisperModel} onChange={(e) => setForm((f) => ({ ...f, whisperModel: e.target.value }))} />
            </Field>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={handleClear} disabled={saving}>
              <Trash2 className="h-3.5 w-3.5" /> {tApp("delete")}
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function KeyRow({ label, configured, masked }: { label: string; configured: boolean; masked: string | null }) {
  const t = useTranslations("settings");
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {configured ? (
        <Badge variant="success" className="font-mono">
          {masked}
        </Badge>
      ) : (
        <Badge variant="destructive">{t("missing")}</Badge>
      )}
    </div>
  );
}
