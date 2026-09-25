"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireUser } from "@/lib/supabase/server";
import { updateCompanySettings, updateAiKeys, clearAiKeys } from "@/server/queries/settings";
import { companySettingsSchema, aiKeysSchema } from "@/lib/validators/settings";
import type { z } from "zod";

async function assertPassword(password: string) {
  const user = await requireUser();
  if (!user.email) throw new Error("INVALID_PASSWORD");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (error) throw new Error("INVALID_PASSWORD");
}

export async function updateCompanySettingsAction(raw: z.infer<typeof companySettingsSchema>) {
  await requireUser();
  const data = companySettingsSchema.parse(raw);
  await updateCompanySettings(data);
  revalidatePath("/settings");
}

export async function verifyPasswordAction(password: string): Promise<{ ok: boolean }> {
  try {
    await assertPassword(password);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function updateAiKeysAction(password: string, raw: z.infer<typeof aiKeysSchema>) {
  await assertPassword(password);
  const data = aiKeysSchema.parse(raw);
  await updateAiKeys(data);
  revalidatePath("/settings");
}

export async function clearAiKeysAction(password: string) {
  await assertPassword(password);
  await clearAiKeys();
  revalidatePath("/settings");
}
