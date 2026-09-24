import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import type { ServiceCategory } from "@/db/schema";
import { cn } from "@/lib/utils";

const colorByCategory: Record<ServiceCategory, string> = {
  network_infrastructure: "border-info/30 bg-info-soft text-info",
  server_infrastructure: "border-primary/30 bg-accent text-accent-foreground",
  cybersecurity: "border-destructive/30 bg-destructive/10 text-destructive",
  physical_security: "border-warning/30 bg-warning-soft text-warning",
  low_voltage: "border-border-strong bg-muted text-foreground",
  managed_it: "border-success/30 bg-success-soft text-success",
};

export function CategoryBadge({ category, className }: { category: ServiceCategory; className?: string }) {
  const t = useTranslations("catalog.categories");
  return <Badge className={cn(colorByCategory[category], className)}>{t(category)}</Badge>;
}
