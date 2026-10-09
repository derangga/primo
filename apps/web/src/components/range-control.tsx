import { rangeDays, type RangeDays } from "@primo/contract/window";
import { rangeLabels } from "~/range";
import { Field } from "~/components/picker";
import { cn } from "~/lib/utils";

// Three segments, one always selected. Selected is aria-pressed; from 640 px it is as wide as
// its segments, below that it fills its row with equal segments.
export function RangeControl(props: {
  readonly value: RangeDays;
  readonly onChange: (range: RangeDays) => void;
}) {
  return (
    <Field label="Range">
      <div
        role="group"
        aria-label="Range"
        className="inline-flex w-full gap-0.5 rounded-md border border-border bg-card p-[3px] sm:w-auto"
      >
        {rangeDays.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={days === props.value}
            onClick={() => props.onChange(days)}
            className={cn(
              "h-8 flex-1 rounded-[6px] px-3 font-medium whitespace-nowrap text-text-2 fine-hover:hover:bg-hover fine-hover:hover:text-text aria-pressed:bg-accent-soft aria-pressed:text-accent sm:flex-none",
            )}
          >
            {rangeLabels[days]}
          </button>
        ))}
      </div>
    </Field>
  );
}
