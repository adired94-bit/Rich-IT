import type { EventStatus, EventType } from "@/db/schema";

export const statusColors: Record<EventStatus, { bg: string; border: string; text: string; dot: string }> = {
  scheduled: { bg: "bg-info-soft", border: "border-info/40", text: "text-info", dot: "bg-info" },
  in_progress: { bg: "bg-warning-soft", border: "border-warning/40", text: "text-warning", dot: "bg-warning" },
  completed: { bg: "bg-success-soft", border: "border-success/40", text: "text-success", dot: "bg-success" },
  cancelled: { bg: "bg-muted", border: "border-border-strong", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export const typeIconKey: Record<EventType, string> = {
  visit: "MapPin",
  remote: "Video",
  task: "CheckSquare",
  meeting: "Users",
  reminder: "Bell",
};
