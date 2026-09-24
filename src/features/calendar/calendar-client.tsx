"use client";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Plus, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MonthView } from "./month-view";
import { TimeGrid } from "./time-grid";
import { AgendaView } from "./agenda-view";
import { EventFormDialog } from "./event-form-dialog";
import { fetchEventsAction, moveEventAction } from "@/server/actions/calendar";
import { getRange, shiftAnchor, weekDays, type CalendarView } from "./calendar-range";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import type { CalendarEvent } from "@/db/schema";

type EventWithClient = CalendarEvent & { client: { id: string; name: string } | null };
interface ClientOption { id: string; name: string }

export function CalendarClient({ clients, icsUrl }: { clients: ClientOption[]; icsUrl: string }) {
  const t = useTranslations("calendar");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();

  const [view, setView] = React.useState<CalendarView>("month");
  const [anchor, setAnchor] = React.useState(() => new Date());
  const [clientFilter, setClientFilter] = React.useState<string>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EventWithClient | null>(null);
  const [defaultStart, setDefaultStart] = React.useState<Date | undefined>(undefined);
  const [icsOpen, setIcsOpen] = React.useState(false);

  const range = React.useMemo(() => getRange(view, anchor), [view, anchor]);
  const queryKey = ["calendar-events", range.start.toISOString(), range.end.toISOString(), clientFilter];

  const { data: events = [], isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchEventsAction(range.start.toISOString(), range.end.toISOString(), clientFilter === "all" ? undefined : clientFilter) as Promise<EventWithClient[]>,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
  }

  function openNew(start?: Date) {
    setEditing(null);
    setDefaultStart(start);
    setFormOpen(true);
  }
  function openEdit(ev: EventWithClient) {
    setEditing(ev);
    setFormOpen(true);
  }

  async function handleDrop(eventId: string, newDay: Date, hour?: number) {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);
    const duration = end.getTime() - start.getTime();
    const newStart = new Date(newDay);
    if (hour !== undefined) {
      newStart.setHours(hour, 0, 0, 0);
    } else {
      newStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
    }
    const newEnd = new Date(newStart.getTime() + duration);
    try {
      await moveEventAction(eventId, newStart.toISOString(), newEnd.toISOString());
      toast.success(t("moved"));
      invalidate();
    } catch {
      toast.error(tApp("error"));
    }
  }

  const label = React.useMemo(() => {
    if (view === "month") return formatDate(anchor, locale, { month: "long", year: "numeric" });
    if (view === "day") return formatDate(anchor, locale, { weekday: "long", day: "2-digit", month: "long" });
    if (view === "agenda") return t("agenda");
    const days = weekDays(anchor);
    return `${formatDate(days[0], locale, { day: "2-digit", month: "2-digit" })} – ${formatDate(days[6], locale, { day: "2-digit", month: "2-digit" })}`;
  }, [view, anchor, locale, t]);

  async function copyIcs() {
    await navigator.clipboard.writeText(icsUrl);
    toast.success(tApp("copied"));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setAnchor((a) => shiftAnchor(view, a, -1))}>
            <ChevronRight className="h-4 w-4 rtl:hidden" />
            <ChevronLeft className="h-4 w-4 hidden rtl:block" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>{t("today")}</Button>
          <Button variant="outline" size="icon-sm" onClick={() => setAnchor((a) => shiftAnchor(view, a, 1))}>
            <ChevronLeft className="h-4 w-4 rtl:hidden" />
            <ChevronRight className="h-4 w-4 hidden rtl:block" />
          </Button>
          <p className="min-w-40 text-sm font-semibold text-foreground">{label}</p>
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allClients")}</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <TabsList>
              <TabsTrigger value="month">{t("month")}</TabsTrigger>
              <TabsTrigger value="week">{t("week")}</TabsTrigger>
              <TabsTrigger value="day">{t("day")}</TabsTrigger>
              <TabsTrigger value="agenda">{t("agenda")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon-sm" onClick={() => setIcsOpen(true)} title={t("exportIcs")}>
            <Link2 className="h-4 w-4" />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => openNew()}>
            <Plus className="h-4 w-4" /> {t("new")}
          </Button>
        </div>
      </div>

      {view === "month" && (
        <MonthView
          anchor={anchor}
          events={events}
          locale={locale}
          onDayClick={(day) => openNew(day)}
          onEventClick={openEdit}
          onEventDrop={(id, day) => handleDrop(id, day)}
        />
      )}
      {view === "week" && (
        <TimeGrid
          days={weekDays(anchor)}
          events={events}
          locale={locale}
          onSlotClick={(day, hour) => { const d = new Date(day); d.setHours(hour, 0, 0, 0); openNew(d); }}
          onEventClick={openEdit}
          onEventDrop={(id, day, hour) => handleDrop(id, day, hour)}
        />
      )}
      {view === "day" && (
        <TimeGrid
          days={[anchor]}
          events={events}
          locale={locale}
          onSlotClick={(day, hour) => { const d = new Date(day); d.setHours(hour, 0, 0, 0); openNew(d); }}
          onEventClick={openEdit}
          onEventDrop={(id, day, hour) => handleDrop(id, day, hour)}
        />
      )}
      {view === "agenda" && <AgendaView events={events} locale={locale} onEventClick={openEdit} />}

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editing}
        clients={clients}
        defaultStart={defaultStart}
        defaultClientId={clientFilter !== "all" ? clientFilter : undefined}
        onChanged={invalidate}
      />

      <Dialog open={icsOpen} onOpenChange={setIcsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("exportIcs")}</DialogTitle>
            <DialogDescription>{t("icsHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input readOnly dir="ltr" value={icsUrl} onFocus={(e) => e.currentTarget.select()} />
            <Button variant="outline" onClick={copyIcs}>{tApp("copy")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
