import type { IsoDate } from "@primo/contract/schemas";
import { formatDate } from "~/date-badge-state";
import { dateFormat } from "~/i18n";

const utcDay = (date: IsoDate) => new Date(`${date}T00:00:00Z`);

// "Wed, 7 Oct 2026", as the date trigger shows it, or "Rab, 7 Okt 2026" in Indonesian.
export const formatDateWithWeekday = (date: IsoDate) =>
  `${dateFormat("weekday", { weekday: "short", timeZone: "UTC" }).format(utcDay(date))}, ${formatDate(date)}`;

// A day as a local-midnight Date, which is what the calendar draws. "2026-10-09" becomes 9 October
// on the viewer's own clock, so the day never slips across a time zone.
export const localDay = (date: IsoDate) => new Date(`${date}T00:00:00`);

// The same day back as yyyy-mm-dd, to look it up among the API's dates.
export const localDayKey = (day: Date) =>
  `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
