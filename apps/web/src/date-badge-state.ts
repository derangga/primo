import { IsoDate, type DatesResponse } from "@primo/contract/schemas";
import { dateFormat } from "~/i18n";

export type BadgeState =
  | { readonly kind: "loading" }
  | { readonly kind: "fresh"; readonly date: IsoDate }
  | { readonly kind: "stale"; readonly date: IsoDate; readonly ageDays: number }
  | { readonly kind: "error" };

// The newest date is stale when it is more than this many days old (DESIGN.UI.md, Date badge).
const staleAfterDays = 4;

const dayMs = 24 * 60 * 60 * 1000;

// Whole calendar days from `date` to `today`, both read as UTC days. Jakarta is 7 hours ahead,
// which moves a boundary by at most a day and never decides a 4-day threshold.
const daysBetween = (date: IsoDate, today: IsoDate) =>
  Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / dayMs);

// `dates` is the API's list, oldest first. A list with no dates means nothing was ever stored,
// which the visitor needs to know about as much as a failed request.
export function badgeState(dates: ReadonlyArray<IsoDate>, today: IsoDate): BadgeState {
  const newest = dates.at(-1);

  if (newest === undefined) {
    return { kind: "error" };
  }

  const ageDays = daysBetween(newest, today);

  return ageDays > staleAfterDays
    ? { kind: "stale", date: newest, ageDays }
    : { kind: "fresh", date: newest };
}

// For useQuery's select: the badge state of an API response, measured against today.
export const badgeStateOfResponse = (response: DatesResponse) =>
  badgeState(response.dates, IsoDate.make(new Date().toISOString().slice(0, 10)));

// The parts of a UTC day in the active locale, put in day, month, year order whatever order the
// locale's own pattern uses, so English reads "7 Oct 2026" and Indonesian "7 Okt 2026".
function dayMonthYear(date: Date, withYear: boolean) {
  const parts = dateFormat("day-month-year", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((each) => each.type === type)?.value ?? "";

  const dayMonth = `${part("day")} ${part("month")}`;

  return withYear ? `${dayMonth} ${part("year")}` : dayMonth;
}

// "2026-10-07" as "7 Oct 2026", or "7 Okt 2026" in Indonesian.
export const formatDate = (date: IsoDate) => dayMonthYear(new Date(`${date}T00:00:00Z`), true);

// A UTC day as "8 Sep", for the chart's time axis.
export const formatDayMonth = (date: Date) => dayMonthYear(date, false);
