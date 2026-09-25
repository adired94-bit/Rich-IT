import { HDate, HebrewCalendar, flags } from "@hebcal/core";

/** Compact Hebrew date for a day cell, e.g. "ט״ו כסלו" (no year, no nikud). */
export function hebrewDateShort(date: Date): string {
  return new HDate(date).renderGematriya(true, true);
}

/** Full Hebrew date including year, e.g. "ט״ו כסלו תשפ״ה". */
export function hebrewDateFull(date: Date): string {
  return new HDate(date).renderGematriya(true);
}

export interface HolidayInfo {
  /** Gregorian date (local midnight) the holiday falls on. */
  date: Date;
  /** Hebrew-locale title, e.g. "חנוכה: א׳ נר". */
  titleHe: string;
  /** English/transliterated fallback title for the Russian UI. */
  titleEn: string;
  /** Major holiday (yom tov) vs. a lighter marker (Rosh Chodesh, minor fast, modern day). */
  isMajor: boolean;
  emoji?: string;
}

/**
 * Jewish holidays, Rosh Chodesh, and fasts within [start, end] using the
 * Israel holiday schedule. Pure local computation (no network/API calls),
 * safe to call from client components.
 */
export function getHolidaysInRange(start: Date, end: Date): HolidayInfo[] {
  const events = HebrewCalendar.calendar({
    start,
    end,
    il: true,
    noSpecialShabbat: true,
  });

  return events.map((ev) => ({
    date: ev.getDate().greg(),
    titleHe: ev.render("he"),
    titleEn: ev.render("en"),
    isMajor: Boolean(ev.getFlags() & (flags.CHAG | flags.MAJOR_FAST)),
    emoji: ev.emoji,
  }));
}
