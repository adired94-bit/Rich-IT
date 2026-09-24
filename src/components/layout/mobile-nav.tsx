"use client";
import * as React from "react";
import { Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar";
import { VisuallyHidden } from "@/components/shared/visually-hidden";
import { useTranslations } from "next-intl";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const t = useTranslations("app");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label={t("openMenu")}>
        <Menu className="h-5 w-5" />
      </Button>
      <DialogContent className="start-0 top-0 h-dvh max-h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none p-0 data-[state=open]:slide-in-from-start-1/2 rtl:data-[state=open]:slide-in-from-right-1/2">
        <VisuallyHidden>
          <DialogTitle>Navigation</DialogTitle>
        </VisuallyHidden>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
