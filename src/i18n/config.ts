export const locales = ["he", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "he";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

/** BCP-47 tags used for Intl formatting (dates, numbers, currency). */
export const intlLocale: Record<Locale, string> = { he: "he-IL", ru: "ru-RU" };
