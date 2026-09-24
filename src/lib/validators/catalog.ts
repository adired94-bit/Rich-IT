import { z } from "zod";

export const serviceCategories = [
  "network_infrastructure",
  "server_infrastructure",
  "cybersecurity",
  "physical_security",
  "low_voltage",
  "managed_it",
] as const;

export const billingTypes = ["hourly", "fixed", "retainer", "hardware_markup"] as const;

export const serviceFormSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(serviceCategories),
  sku: z.string().trim().optional().or(z.literal("")),
  titleHe: z.string().trim().min(1, "required"),
  titleRu: z.string().trim().min(1, "required"),
  descriptionHe: z.string().trim().optional().or(z.literal("")),
  descriptionRu: z.string().trim().optional().or(z.literal("")),
  keywords: z.array(z.string()).default([]),
  defaultPrice: z.coerce.number().min(0),
  billingType: z.enum(billingTypes),
  unit: z.string().trim().min(1).default("unit"),
  markupPercent: z.coerce.number().min(0).max(500).optional().nullable(),
  includedHours: z.coerce.number().min(0).optional().nullable(),
  active: z.boolean().default(true),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
