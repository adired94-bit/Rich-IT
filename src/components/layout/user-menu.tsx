"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import Link from "next/link";

export function UserMenu({ email }: { email?: string | null }) {
  const t = useTranslations("app");
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full outline-none cursor-pointer" aria-label={t("openMenu")}>
          <Avatar className="h-8 w-8 border border-border-strong">
            <AvatarFallback className="bg-accent text-accent-foreground">{email ? initials(email) : <User className="h-4 w-4" />}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" /> {t("more")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={signOut}>
          <LogOut className="h-4 w-4" /> {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
