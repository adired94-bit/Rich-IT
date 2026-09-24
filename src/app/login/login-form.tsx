"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [magicLoading, setMagicLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(t("invalid"));
      return;
    }
    router.push(params.get("next") ?? "/");
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error(t("email"));
      return;
    }
    setMagicLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${params.get("next") ?? "/"}` },
    });
    setMagicLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("magicLinkSent"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!configured ? (
          <p className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-xs text-warning">{t("notConfigured")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="engineer@rich-it.co.il" />
            </div>
            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t("signingIn") : t("signIn")}
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={magicLoading} onClick={handleMagicLink}>
              {magicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {t("magicLink")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
