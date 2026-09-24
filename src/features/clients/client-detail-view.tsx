"use client";
import * as React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Mic, Phone, MessageCircle, Pencil, Mail, MapPin, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusDot } from "@/components/ui/status-dot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientFormDialog } from "./client-form-dialog";
import { OverviewTab } from "./tabs/overview-tab";
import { HistoryTab } from "./tabs/history-tab";
import { CalendarTab } from "./tabs/calendar-tab";
import { VaultTab } from "./tabs/vault-tab";
import { DocumentsTab } from "./tabs/documents-tab";
import { RetainersTab } from "./tabs/retainers-tab";
import { useUiStore } from "@/stores/ui-store";
import { initials, toWhatsAppNumber } from "@/lib/utils";
import type {
  listVaultEntries,
  listRetainers,
  listInteractions,
  listClientEvents,
  listClientWorkOrders,
  getClientOverviewStats,
} from "@/server/queries/clients";
import type { Client } from "@/db/schema";

interface Props {
  client: Client;
  vault: Awaited<ReturnType<typeof listVaultEntries>>;
  retainers: Awaited<ReturnType<typeof listRetainers>>;
  interactions: Awaited<ReturnType<typeof listInteractions>>;
  events: Awaited<ReturnType<typeof listClientEvents>>;
  workOrders: Awaited<ReturnType<typeof listClientWorkOrders>>;
  stats: Awaited<ReturnType<typeof getClientOverviewStats>>;
}

export function ClientDetailView({ client, vault, retainers, interactions, events, workOrders, stats }: Props) {
  const t = useTranslations("clients");
  const tApp = useTranslations("app");
  const tWo = useTranslations("workOrders");
  const locale = useLocale();
  const [editOpen, setEditOpen] = React.useState(false);
  const openQuickRecord = useUiStore((s) => s.openQuickRecord);
  const whatsapp = toWhatsAppNumber(client.phone);

  return (
    <div className="space-y-5">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /> {tApp("back")}
      </Link>

      <div className="glass flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border border-border-strong text-lg">
            <AvatarFallback>{initials(client.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{client.name}</h1>
              <Badge variant="outline" className="gap-1">
                <StatusDot status={client.status} />
                {t(`statuses.${client.status}`)}
              </Badge>
              {client.slaLevel !== "none" && <Badge variant="primary">{t(`slaLevels.${client.slaLevel}`)}</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {client.contactPerson && <span>{client.contactPerson}</span>}
              {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
              {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
              {client.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.address}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5" asChild>
            <Link href={`/work-orders/new?clientId=${client.id}`}>
              <FilePlus2 className="h-4 w-4" /> {tWo("new")}
            </Link>
          </Button>
          <Button variant="voice" size="sm" className="gap-1.5" onClick={() => openQuickRecord(client.id)}>
            <Mic className="h-4 w-4" /> {t("overview.recordForClient")}
          </Button>
          {whatsapp && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> {t("overview.whatsapp")}
              </a>
            </Button>
          )}
          <Button variant="outline" size="icon-sm" onClick={() => setEditOpen(true)} aria-label={t("edit")}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
          <TabsTrigger value="calendar">{t("tabs.calendar")}</TabsTrigger>
          <TabsTrigger value="retainers">{t("tabs.retainers")}</TabsTrigger>
          <TabsTrigger value="vault">{t("tabs.vault")}</TabsTrigger>
          <TabsTrigger value="documents">{t("tabs.documents")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab client={client} stats={stats} interactions={interactions} events={events} locale={locale as "he" | "ru"} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab clientId={client.id} interactions={interactions} />
        </TabsContent>
        <TabsContent value="calendar">
          <CalendarTab events={events} />
        </TabsContent>
        <TabsContent value="retainers">
          <RetainersTab clientId={client.id} retainers={retainers} />
        </TabsContent>
        <TabsContent value="vault">
          <VaultTab clientId={client.id} entries={vault} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab clientId={client.id} workOrders={workOrders} />
        </TabsContent>
      </Tabs>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
    </div>
  );
}
