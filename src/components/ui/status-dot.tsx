import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  scheduled: "bg-info text-info",
  in_progress: "bg-warning text-warning",
  completed: "bg-success text-success",
  cancelled: "bg-muted-foreground text-muted-foreground",
  draft: "bg-muted-foreground text-muted-foreground",
  sent: "bg-info text-info",
  viewed: "bg-warning text-warning",
  signed: "bg-success text-success",
  active: "bg-success text-success",
  inactive: "bg-muted-foreground text-muted-foreground",
  lead: "bg-voice text-voice",
};

export function StatusDot({ status, className }: { status: string; className?: string }) {
  return <span className={cn("status-dot", colorMap[status] ?? "bg-muted-foreground text-muted-foreground", className)} />;
}
