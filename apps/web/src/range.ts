import type { RangeDays } from "@primo/contract/window";
import { m } from "~/paraglide/messages.js";

const rangeMessages: Record<RangeDays, () => string> = {
  7: m.range_7,
  30: m.range_30,
  90: m.range_90,
};

// The chart's ranges in words, in the active locale.
export const rangeLabel = (days: RangeDays) => rangeMessages[days]();
