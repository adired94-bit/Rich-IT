import { LayoutDashboard, Users, ListChecks, CalendarDays, FileText, Settings } from "lucide-react";

export const navItems = [
  { href: "/", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/clients", labelKey: "clients" as const, icon: Users },
  { href: "/catalog", labelKey: "catalog" as const, icon: ListChecks },
  { href: "/calendar", labelKey: "calendar" as const, icon: CalendarDays },
  { href: "/work-orders", labelKey: "workOrders" as const, icon: FileText },
  { href: "/settings", labelKey: "settings" as const, icon: Settings },
];
