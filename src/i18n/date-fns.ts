import { he, ru } from "date-fns/locale";
import type { Locale } from "./config";

export const dateFnsLocales = { he, ru } as const;
export function getDateFnsLocale(locale: Locale) {
  return dateFnsLocales[locale];
}
