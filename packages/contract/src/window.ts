import type { IsoDate } from "./schemas.ts";

const dayMs = 24 * 60 * 60 * 1000;

// The ranges the Chart tab offers, in days: 7 days, 1 month and 3 months.
export const rangeDays = [7, 30, 90] as const;

export type RangeDays = (typeof rangeDays)[number];

// The calendar day of `now` in UTC, the same day the ingest uses for "today".
export const dayOf = (now: Date) => now.toISOString().slice(0, 10);

// The first day of a range of `days` calendar days that ends on `today`, as yyyy-mm-dd:
// 7 days ending 2026-10-09 start on 2026-10-03. The backend cuts the series here and the website
// draws its weekdays from here, so the two agree on where a range begins.
export const windowStart = (today: IsoDate, days: number) =>
  new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * dayMs).toISOString().slice(0, 10);
