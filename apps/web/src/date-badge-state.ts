import { IsoDate, type DatesResponse } from "@primo/contract/schemas";

export type BadgeState =
  | { readonly kind: "loading" }
  | { readonly kind: "fresh"; readonly date: IsoDate }
  | { readonly kind: "stale"; readonly date: IsoDate; readonly ageDays: number }
  | { readonly kind: "error" };

// The newest date is stale when it is more than this many days old (DESIGN.UI.md, Date badge).
const staleAfterDays = 4;

const dayMs = 24 * 60 * 60 * 1000;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

// "2026-10-07" as "7 Oct 2026".
export function formatDate(date: IsoDate) {
  const [year = "", month = "1", day = "1"] = date.split("-");

  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

// A UTC day as "8 Sep", for the chart's time axis.
export const formatDayMonth = (date: Date) => `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
