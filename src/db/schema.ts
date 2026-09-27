import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const serviceCategoryEnum = pgEnum("service_category", [
  "network_infrastructure",
  "server_infrastructure",
  "cybersecurity",
  "physical_security",
  "low_voltage",
  "managed_it",
]);

export const billingTypeEnum = pgEnum("billing_type", [
  "hourly",
  "fixed",
  "retainer",
  "hardware_markup",
]);

export const slaLevelEnum = pgEnum("sla_level", ["none", "basic", "standard", "premium", "enterprise"]);

export const clientStatusEnum = pgEnum("client_status", ["active", "inactive", "lead"]);

export const vaultCategoryEnum = pgEnum("vault_category", [
  "server",
  "network",
  "wifi",
  "cloud",
  "credentials",
  "note",
]);

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "draft",
  "sent",
  "viewed",
  "signed",
  "cancelled",
]);

export const documentLanguageEnum = pgEnum("document_language", ["he", "ru", "dual"]);

export const itemTypeEnum = pgEnum("item_type", ["service", "hardware", "labor", "discount"]);

export const eventStatusEnum = pgEnum("event_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "visit",
  "remote",
  "task",
  "meeting",
  "reminder",
]);

export const interactionTypeEnum = pgEnum("interaction_type", [
  "note",
  "call",
  "visit",
  "remote",
  "email",
  "whatsapp",
  "work_order",
  "event",
  "voice_log",
]);

export const voiceLogStatusEnum = pgEnum("voice_log_status", ["processing", "done", "failed"]);

export const documentEventEnum = pgEnum("document_event", ["created", "sent", "viewed", "signed", "cancelled"]);

/* ------------------------------------------------------------------ */
/* Shared column helpers                                               */
/* ------------------------------------------------------------------ */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" });

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    notes: text("notes"),
    slaLevel: slaLevelEnum("sla_level").default("none").notNull(),
    status: clientStatusEnum("status").default("active").notNull(),
    /** Preferred document language for this client */
    preferredLanguage: documentLanguageEnum("preferred_language").default("he").notNull(),
    hourlyRate: money("hourly_rate"),
    billingInfo: jsonb("billing_info")
      .$type<{ vatId?: string; billingEmail?: string; paymentTerms?: string; billingAddress?: string }>()
      .default({})
      .notNull(),
    tags: text("tags").array().default(sql`'{}'::text[]`).notNull(),
    ...timestamps,
  },
  (t) => [index("clients_name_idx").on(t.name), index("clients_status_idx").on(t.status)],
);

export const clientVault = pgTable(
  "client_vault",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    category: vaultCategoryEnum("category").default("credentials").notNull(),
    /** AES-256-GCM payload: base64(iv).base64(tag).base64(ciphertext) */
    encryptedData: text("encrypted_data").notNull(),
    ...timestamps,
  },
  (t) => [index("client_vault_client_idx").on(t.clientId)],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: serviceCategoryEnum("category").notNull(),
    sku: text("sku"),
    titleHe: text("title_he").notNull(),
    titleRu: text("title_ru").notNull(),
    descriptionHe: text("description_he"),
    descriptionRu: text("description_ru"),
    /** Keywords in he/ru/en to help the AI match spoken services */
    keywords: text("keywords").array().default(sql`'{}'::text[]`).notNull(),
    defaultPrice: money("default_price").notNull(),
    billingType: billingTypeEnum("billing_type").default("fixed").notNull(),
    /** hour | unit | month | project | meter */
    unit: text("unit").default("unit").notNull(),
    /** For hardware_markup: percentage added on top of cost */
    markupPercent: numeric("markup_percent", { precision: 5, scale: 2, mode: "number" }),
    /** For retainer: hours included per month */
    includedHours: numeric("included_hours", { precision: 6, scale: 2, mode: "number" }),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("services_sku_idx").on(t.sku),
    index("services_category_idx").on(t.category),
    index("services_active_idx").on(t.active),
  ],
);

export const retainers = pgTable(
  "retainers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    totalHours: numeric("total_hours", { precision: 6, scale: 2, mode: "number" }).notNull(),
    monthlyFee: money("monthly_fee").notNull(),
    /** Rate charged for hours beyond the bank */
    overageRate: money("overage_rate"),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [index("retainers_client_idx").on(t.clientId)],
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human friendly sequential number e.g. WO-2026-0042 */
    number: text("number").notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "restrict" })
      .notNull(),
    date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    internalNotes: text("internal_notes"),
    nextSteps: text("next_steps"),
    language: documentLanguageEnum("language").default("he").notNull(),
    status: workOrderStatusEnum("status").default("draft").notNull(),
    subtotal: money("subtotal").default(0).notNull(),
    discount: money("discount").default(0).notNull(),
    vatRate: numeric("vat_rate", { precision: 5, scale: 4, mode: "number" }).default(0.18).notNull(),
    vatAmount: money("vat_amount").default(0).notNull(),
    totalAmount: money("total_amount").default(0).notNull(),
    currency: text("currency").default("ILS").notNull(),
    timeSpentMinutes: integer("time_spent_minutes").default(0).notNull(),
    performerName: text("performer_name"),
    rawAudioUrl: text("raw_audio_url"),
    transcript: text("transcript"),
    aiResult: jsonb("ai_result").$type<Record<string, unknown>>(),
    signatureUrl: text("signature_url"),
    signerName: text("signer_name"),
    pdfUrl: text("pdf_url"),
    /** Unguessable token used in the public approval link */
    approvalToken: text("approval_token")
      .notNull()
      .default(sql`encode(gen_random_bytes(24), 'hex')`),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    /** Ops: work completed (בוצע) */
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Ops: payment received (שולם) */
    isPaid: boolean("is_paid").default(false).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("work_orders_number_idx").on(t.number),
    uniqueIndex("work_orders_approval_token_idx").on(t.approvalToken),
    index("work_orders_client_idx").on(t.clientId),
    index("work_orders_status_idx").on(t.status),
    index("work_orders_date_idx").on(t.date),
    index("work_orders_is_paid_idx").on(t.isPaid),
  ],
);

export const workOrderItems = pgTable(
  "work_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "cascade" })
      .notNull(),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    itemType: itemTypeEnum("item_type").default("service").notNull(),
    description: text("description").notNull(),
    descriptionRu: text("description_ru"),
    quantity: numeric("quantity", { precision: 10, scale: 2, mode: "number" }).default(1).notNull(),
    unit: text("unit").default("unit").notNull(),
    unitPrice: money("unit_price").default(0).notNull(),
    /** Line discount (absolute amount) */
    discount: money("discount").default(0).notNull(),
    total: money("total").default(0).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("work_order_items_wo_idx").on(t.workOrderId)],
);

export const retainerUsage = pgTable(
  "retainer_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    retainerId: uuid("retainer_id")
      .references(() => retainers.id, { onDelete: "cascade" })
      .notNull(),
    workOrderId: uuid("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
    hours: numeric("hours", { precision: 6, scale: 2, mode: "number" }).notNull(),
    note: text("note"),
    usedAt: timestamp("used_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("retainer_usage_retainer_idx").on(t.retainerId)],
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    workOrderId: uuid("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    allDay: boolean("all_day").default(false).notNull(),
    status: eventStatusEnum("status").default("scheduled").notNull(),
    type: eventTypeEnum("type").default("visit").notNull(),
    googleEventId: text("google_event_id"),
    ...timestamps,
  },
  (t) => [
    index("calendar_events_start_idx").on(t.startTime),
    index("calendar_events_client_idx").on(t.clientId),
  ],
);

export const interactionLogs = pgTable(
  "interaction_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    type: interactionTypeEnum("type").default("note").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    workOrderId: uuid("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
    eventId: uuid("event_id").references(() => calendarEvents.id, { onDelete: "set null" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("interaction_logs_client_idx").on(t.clientId, t.occurredAt)],
);

export const voiceLogs = pgTable(
  "voice_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    workOrderId: uuid("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
    audioUrl: text("audio_url"),
    durationSeconds: integer("duration_seconds"),
    transcript: text("transcript"),
    languageDetected: text("language_detected"),
    aiResult: jsonb("ai_result").$type<Record<string, unknown>>(),
    status: voiceLogStatusEnum("status").default("processing").notNull(),
    error: text("error"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("voice_logs_client_idx").on(t.clientId)],
);

export const documentEvents = pgTable(
  "document_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id, { onDelete: "cascade" })
      .notNull(),
    event: documentEventEnum("event").notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}).notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("document_events_wo_idx").on(t.workOrderId)],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  endpoint: text("endpoint").notNull().unique(),
  keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamps.createdAt,
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamps.updatedAt,
});

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const clientsRelations = relations(clients, ({ many }) => ({
  vault: many(clientVault),
  workOrders: many(workOrders),
  events: many(calendarEvents),
  retainers: many(retainers),
  interactions: many(interactionLogs),
  voiceLogs: many(voiceLogs),
}));

export const clientVaultRelations = relations(clientVault, ({ one }) => ({
  client: one(clients, { fields: [clientVault.clientId], references: [clients.id] }),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  items: many(workOrderItems),
}));

export const retainersRelations = relations(retainers, ({ one, many }) => ({
  client: one(clients, { fields: [retainers.clientId], references: [clients.id] }),
  service: one(services, { fields: [retainers.serviceId], references: [services.id] }),
  usage: many(retainerUsage),
}));

export const retainerUsageRelations = relations(retainerUsage, ({ one }) => ({
  retainer: one(retainers, { fields: [retainerUsage.retainerId], references: [retainers.id] }),
  workOrder: one(workOrders, { fields: [retainerUsage.workOrderId], references: [workOrders.id] }),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  client: one(clients, { fields: [workOrders.clientId], references: [clients.id] }),
  items: many(workOrderItems),
  events: many(documentEvents),
}));

export const workOrderItemsRelations = relations(workOrderItems, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderItems.workOrderId], references: [workOrders.id] }),
  service: one(services, { fields: [workOrderItems.serviceId], references: [services.id] }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  client: one(clients, { fields: [calendarEvents.clientId], references: [clients.id] }),
  workOrder: one(workOrders, { fields: [calendarEvents.workOrderId], references: [workOrders.id] }),
}));

export const interactionLogsRelations = relations(interactionLogs, ({ one }) => ({
  client: one(clients, { fields: [interactionLogs.clientId], references: [clients.id] }),
  workOrder: one(workOrders, { fields: [interactionLogs.workOrderId], references: [workOrders.id] }),
  event: one(calendarEvents, { fields: [interactionLogs.eventId], references: [calendarEvents.id] }),
}));

export const voiceLogsRelations = relations(voiceLogs, ({ one }) => ({
  client: one(clients, { fields: [voiceLogs.clientId], references: [clients.id] }),
  workOrder: one(workOrders, { fields: [voiceLogs.workOrderId], references: [workOrders.id] }),
}));

export const documentEventsRelations = relations(documentEvents, ({ one }) => ({
  workOrder: one(workOrders, { fields: [documentEvents.workOrderId], references: [workOrders.id] }),
}));

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type VaultEntry = typeof clientVault.$inferSelect;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Retainer = typeof retainers.$inferSelect;
export type RetainerUsage = typeof retainerUsage.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;
export type WorkOrderItem = typeof workOrderItems.$inferSelect;
export type NewWorkOrderItem = typeof workOrderItems.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type InteractionLog = typeof interactionLogs.$inferSelect;
export type VoiceLog = typeof voiceLogs.$inferSelect;
export type DocumentEvent = typeof documentEvents.$inferSelect;

export type ServiceCategory = (typeof serviceCategoryEnum.enumValues)[number];
export type BillingType = (typeof billingTypeEnum.enumValues)[number];
export type SlaLevel = (typeof slaLevelEnum.enumValues)[number];
export type ClientStatus = (typeof clientStatusEnum.enumValues)[number];
export type VaultCategory = (typeof vaultCategoryEnum.enumValues)[number];
export type WorkOrderStatus = (typeof workOrderStatusEnum.enumValues)[number];
export type DocumentLanguage = (typeof documentLanguageEnum.enumValues)[number];
export type ItemType = (typeof itemTypeEnum.enumValues)[number];
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
export type InteractionType = (typeof interactionTypeEnum.enumValues)[number];
