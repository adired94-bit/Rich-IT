import { z } from "zod";

export const companySettingsSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  vatId: z.string().trim().optional().default(""),
  website: z.string().trim().optional().default(""),
  engineerName: z.string().trim().optional().default(""),
  defaultVatRate: z.coerce.number().min(0).max(1),
});
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

export const aiKeysSchema = z.object({
  anthropicApiKey: z.string().trim().optional().default(""),
  openaiApiKey: z.string().trim().optional().default(""),
  claudeModel: z.string().trim().optional().default(""),
  whisperModel: z.string().trim().optional().default(""),
});
export type AiKeysInput = z.infer<typeof aiKeysSchema>;
