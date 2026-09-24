"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image src="/icons/icon-96.png" alt="" width={32} height={32} className="rounded-lg" />
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">Rich IT Solutions</p>
          <p className="text-[11px] text-muted-foreground">מרכז שליטה</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_rgba(0,240,255,0.25)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 shrink-0", active && "text-primary")} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-[10px] text-muted-foreground/70">Rich IT Solutions © {new Date().getFullYear()}</div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 border-e border-border bg-background-elevated/70 backdrop-blur-xl lg:block">
      <SidebarNav />
    </aside>
  );
}
