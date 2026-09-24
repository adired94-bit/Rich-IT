import { z } from "zod";

export const slaLevels = ["none", "basic", "standard", "premium", "enterprise"] as const;
export const clientStatuses = ["active", "inactive", "lead"] as const;
export const documentLanguages = ["he", "ru", "dual"] as const;
export const vaultCategories = ["server", "network", "wifi", "cloud", "credentials", "note"] as const;
export const interactionTypes = [
  "note",
  "call",
  "visit",
  "remote",
  "email",
  "whatsapp",
  "work_order",
  "event",
  "voice_log",
] as const;

export const clientFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "required"),
  contactPerson: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  slaLevel: z.enum(slaLevels).default("none"),
  status: z.enum(clientStatuses).default("active"),
  preferredLanguage: z.enum(documentLanguages).default("he"),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  vatId: z.string().trim().optional().or(z.literal("")),
  billingEmail: z.string().trim().optional().or(z.literal("")),
  paymentTerms: z.string().trim().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
});
export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const vaultFormSchema = z.object({
  id: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  title: z.string().trim().min(1, "required"),
  category: z.enum(vaultCategories).default("credentials"),
  host: z.string().trim().optional().or(z.literal("")),
  username: z.string().trim().optional().or(z.literal("")),
  password: z.string().trim().optional().or(z.literal("")),
  url: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type VaultFormValues = z.infer<typeof vaultFormSchema>;

export interface VaultPayload {
  host?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}

export const retainerFormSchema = z.object({
  id: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  title: z.string().trim().min(1, "required"),
  totalHours: z.coerce.number().min(0.5),
  monthlyFee: z.coerce.number().min(0),
  overageRate: z.coerce.number().min(0).optional().nullable(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  active: z.boolean().default(true),
});
export type RetainerFormValues = z.infer<typeof retainerFormSchema>;

export const retainerUsageSchema = z.object({
  retainerId: z.string().uuid(),
  hours: z.coerce.number().min(0.1),
  note: z.string().trim().optional().or(z.literal("")),
});

export const interactionFormSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(interactionTypes).default("note"),
  title: z.string().trim().min(1, "required"),
  body: z.string().trim().optional().or(z.literal("")),
  occurredAt: z.string().optional(),
});
