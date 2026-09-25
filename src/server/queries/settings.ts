import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { company as companyDefaults } from "@/config/company";
import type { CompanySettingsInput, AiKeysInput } from "@/lib/validators/settings";

const COMPANY_KEY = "company";
const AI_KEYS_KEY = "aiKeys";
const OWNER_SIGNATURE_KEY = "ownerSignature";

export type CompanySettings = typeof companyDefaults & { ownerSignatureUrl: string | null };

export async function getOwnerSignature(): Promise<string | null> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, OWNER_SIGNATURE_KEY) });
  return (row?.value as { dataUrl?: string } | undefined)?.dataUrl ?? null;
}

export async function updateOwnerSignature(dataUrl: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: OWNER_SIGNATURE_KEY, value: { dataUrl } })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: { dataUrl }, updatedAt: new Date() } });
}

export async function clearOwnerSignature(): Promise<void> {
  await db.delete(appSettings).where(eq(appSettings.key, OWNER_SIGNATURE_KEY));
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const [row, ownerSignatureUrl] = await Promise.all([
    db.query.appSettings.findFirst({ where: eq(appSettings.key, COMPANY_KEY) }),
    getOwnerSignature(),
  ]);
  const overrides = (row?.value ?? {}) as Partial<CompanySettingsInput>;
  return { ...companyDefaults, ...overrides, ownerSignatureUrl };
}

export async function updateCompanySettings(data: CompanySettingsInput): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: COMPANY_KEY, value: data })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: data, updatedAt: new Date() } });
}

async function getStoredAiKeys(): Promise<AiKeysInput | null> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, AI_KEYS_KEY) });
  const blob = (row?.value as { blob?: string } | undefined)?.blob;
  if (!blob) return null;
  try {
    return decryptJson<AiKeysInput>(blob);
  } catch {
    return null;
  }
}

/** Resolved keys/models for actually calling the AI providers: DB override, falling back to env vars. */
export async function getAiSettings() {
  const stored = await getStoredAiKeys();
  return {
    anthropicApiKey: stored?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "",
    openaiApiKey: stored?.openaiApiKey || process.env.OPENAI_API_KEY || "",
    claudeModel: stored?.claudeModel || process.env.CLAUDE_MODEL || "claude-opus-5-5",
    whisperModel: stored?.whisperModel || process.env.WHISPER_MODEL || "whisper-1",
  };
}

function maskKey(value: string): string {
  if (value.length <= 6) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

/** Safe-to-render status for the Settings screen: never exposes a usable key. */
export async function getAiKeysStatus() {
  const stored = await getStoredAiKeys();
  const anthropicValue = stored?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "";
  const openaiValue = stored?.openaiApiKey || process.env.OPENAI_API_KEY || "";
  return {
    anthropicConfigured: Boolean(anthropicValue),
    anthropicMasked: anthropicValue ? maskKey(anthropicValue) : null,
    anthropicSource: stored?.anthropicApiKey ? ("app" as const) : anthropicValue ? ("env" as const) : null,
    openaiConfigured: Boolean(openaiValue),
    openaiMasked: openaiValue ? maskKey(openaiValue) : null,
    openaiSource: stored?.openaiApiKey ? ("app" as const) : openaiValue ? ("env" as const) : null,
    claudeModel: stored?.claudeModel || process.env.CLAUDE_MODEL || "claude-opus-5-5",
    whisperModel: stored?.whisperModel || process.env.WHISPER_MODEL || "whisper-1",
  };
}

/** Blank fields in `data` keep whatever is already stored (a blank field is not "set to empty"). */
export async function updateAiKeys(data: AiKeysInput): Promise<void> {
  const existing = await getStoredAiKeys();
  const merged: AiKeysInput = {
    anthropicApiKey: data.anthropicApiKey || existing?.anthropicApiKey || "",
    openaiApiKey: data.openaiApiKey || existing?.openaiApiKey || "",
    claudeModel: data.claudeModel || existing?.claudeModel || "",
    whisperModel: data.whisperModel || existing?.whisperModel || "",
  };
  const blob = encryptJson(merged);
  await db
    .insert(appSettings)
    .values({ key: AI_KEYS_KEY, value: { blob } })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: { blob }, updatedAt: new Date() } });
}

export async function clearAiKeys(): Promise<void> {
  await db.delete(appSettings).where(eq(appSettings.key, AI_KEYS_KEY));
}
