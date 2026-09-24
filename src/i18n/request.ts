import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

// Static (non-computed) imports so serverless bundlers (e.g. Netlify's) reliably
// include both message files — a template-literal `import()` path can silently
// fail to bundle in that environment.
const messagesByLocale: Record<Locale, () => Promise<{ default: Record<string, unknown> }>> = {
  he: () => import("../../messages/he.json"),
  ru: () => import("../../messages/ru.json"),
};

export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : defaultLocale;
  return {
    locale,
    messages: (await messagesByLocale[locale]()).default,
    timeZone: "Asia/Jerusalem",
  };
});
