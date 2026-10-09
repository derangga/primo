import { useId, useState, type ReactNode } from "react";
import { Icon } from "~/components/icon";
import { OptionList } from "~/components/option-list";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import type { PickerEntry } from "~/picker-entries";

// An overline label above its control (.field and .overline in design/components.css).
export function Field(props: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 max-sm:w-full">
      <span className="text-xs font-medium tracking-[0.06em] text-text-2 uppercase">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}

// The one trigger and option list behind the commodity, province, area and date pickers (.ctl,
// .pop, .opt). `className` sets the trigger's width. While its options load it is disabled with a
// skeleton bar in place of the value.
export function Picker<V extends string>(props: {
  readonly label: string;
  readonly entries: ReadonlyArray<PickerEntry<V>>;
  readonly value: V | undefined;
  readonly valueLabel: string;
  readonly onChange: (value: V) => void;
  readonly loading?: boolean;
  readonly className?: string;
}) {
  const { label, entries, value, valueLabel, onChange, loading = false, className } = props;
  const [open, setOpen] = useState(false);
  const labelId = useId();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={loading}
          aria-haspopup="listbox"
          aria-label={loading ? label : `${label}: ${valueLabel}`}
          id={labelId}
          className={cn(
            "flex h-(--control-h) w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-left whitespace-nowrap fine-hover:hover:border-border-strong aria-expanded:border-accent disabled:bg-page disabled:text-text-disabled",
            className,
          )}
        >
          {loading ? (
            <Skeleton className="h-2.5 w-24" />
          ) : (
            <span className="truncate">{valueLabel}</span>
          )}
          <Icon name="down" />
        </button>
      </PopoverTrigger>
      <PopoverContent onOpenAutoFocus={(event) => event.preventDefault()}>
        <OptionList
          entries={entries}
          value={value}
          label={label}
          className="max-h-[360px]"
          onSelect={(next) => {
            setOpen(false);
            onChange(next);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
