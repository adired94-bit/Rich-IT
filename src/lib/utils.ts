import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { intlLocale, type Locale } from "@/i18n/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number | null | undefined, locale: Locale = "he", currency = "ILS") {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatNumber(n: number | null | undefined, locale: Locale = "he", digits = 1) {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits }).format(Number(n ?? 0));
}

export function formatDate(
  date: Date | string | null | undefined,
  locale: Locale = "he",
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" },
) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone: "Asia/Jerusalem", ...opts }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined, locale: Locale = "he") {
  return formatDate(date, locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatTime(date: Date | string | null | undefined, locale: Locale = "he") {
  return formatDate(date, locale, { hour: "2-digit", minute: "2-digit" });
}

export function minutesToHours(minutes: number) {
  return Math.round((minutes / 60) * 100) / 100;
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Normalises an Israeli/Russian phone number to E.164 digits for wa.me links. */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = "972" + digits.slice(1); // 05x-xxxxxxx → 9725x
  if (digits.startsWith("8") && digits.length === 11) digits = "7" + digits.slice(1); // Russian 8xxxxxxxxxx → 7
  return digits.length >= 9 ? digits : null;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function toInputDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toInputDateTime(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toInputDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
