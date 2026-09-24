import { z } from "zod";

export const workOrderStatuses = ["draft", "sent", "viewed", "signed", "cancelled"] as const;
export const documentLanguages = ["he", "ru", "dual"] as const;
export const itemTypes = ["service", "hardware", "labor", "discount"] as const;

export const workOrderItemSchema = z.object({
  id: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional().nullable(),
  itemType: z.enum(itemTypes).default("service"),
  description: z.string().trim().min(1, "required"),
  descriptionRu: z.string().trim().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.01),
  unit: z.string().trim().default("unit"),
  unitPrice: z.coerce.number(),
  discount: z.coerce.number().min(0).default(0),
});
export type WorkOrderItemValues = z.infer<typeof workOrderItemSchema>;

export const workOrderFormSchema = z.object({
  id: z.string().uuid().optional(),
  clientId: z.string().uuid({ message: "required" }),
  date: z.string().min(1),
  title: z.string().trim().min(1, "required"),
  summary: z.string().trim().optional().or(z.literal("")),
  nextSteps: z.string().trim().optional().or(z.literal("")),
  internalNotes: z.string().trim().optional().or(z.literal("")),
  language: z.enum(documentLanguages).default("he"),
  performerName: z.string().trim().optional().or(z.literal("")),
  timeSpentMinutes: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  vatRate: z.coerce.number().min(0).max(1).default(0.18),
  items: z.array(workOrderItemSchema).min(1, "required"),
  retainerId: z.string().uuid().optional().nullable(),
  retainerHours: z.coerce.number().min(0).optional().nullable(),
  transcript: z.string().optional(),
  aiResult: z.record(z.string(), z.unknown()).optional(),
});
export type WorkOrderFormValues = z.infer<typeof workOrderFormSchema>;

export function computeTotals(items: WorkOrderItemValues[], orderDiscount: number, vatRate: number) {
  const subtotal = items.reduce((sum, it) => sum + Math.max(0, it.quantity * it.unitPrice - it.discount), 0);
  const afterDiscount = Math.max(0, subtotal - orderDiscount);
  const vatAmount = afterDiscount * vatRate;
  const totalAmount = afterDiscount + vatAmount;
  return {
    subtotal: round2(subtotal),
    vatAmount: round2(vatAmount),
    totalAmount: round2(totalAmount),
  };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/* -------------------- AI voice extraction contract -------------------- */

export const aiWorkItemSchema = z.object({
  serviceId: z.string().nullable().describe("Matched catalog service id, or null if no good match"),
  description: z.string().describe("Hebrew description of the work/material line"),
  descriptionRu: z.string().describe("Russian translation of the description"),
  itemType: z.enum(itemTypes),
  quantity: z.number(),
  unit: z.string(),
  unitPrice: z.number().describe("Price per unit in ILS, from catalog or a custom price mentioned in the recording"),
  discount: z.number().describe("Absolute discount amount on this line, 0 if none"),
  customPriceReason: z.string().nullable().describe("Why the price differs from the catalog default, or null"),
});

export const aiExtractionSchema = z.object({
  detectedLanguage: z.enum(["he", "ru", "mixed", "other"]),
  clientMatchId: z.string().nullable().describe("Best-matching client id from the provided list, or null"),
  clientNameMentioned: z.string().nullable().describe("Client/company name as mentioned in the recording, if any"),
  title: z.string().describe("Short Hebrew title for the work order, e.g. 'התקנת נקודת גישה ותיקון תקשורת'"),
  summaryHe: z.string().describe("Formal Hebrew paragraph summarizing the work performed"),
  summaryRu: z.string().describe("Formal Russian translation of the summary"),
  items: z.array(aiWorkItemSchema),
  timeSpentMinutes: z.number().describe("Total time spent in minutes, 0 if not mentioned"),
  nextSteps: z.string().nullable().describe("Follow-up tasks or future work mentioned, in Hebrew"),
  confidence: z.number().min(0).max(1).describe("Overall confidence in the extraction, 0 to 1"),
});
export type AiExtraction = z.infer<typeof aiExtractionSchema>;
