import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-14 text-center", className)}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
