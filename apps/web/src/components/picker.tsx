import { useState, type ComponentProps, type ReactNode } from "react";
import { Icon } from "~/components/icon";
import { OptionList } from "~/components/option-list";
import { PickerOverlay } from "~/components/picker-overlay";
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

// The trigger of every picker (.ctl): the current value and a chevron. `className` sets its width.
// While the options load it is disabled with a skeleton bar in place of the value. Radix passes
// its trigger props through, so the date picker's sheet and popover use it too.
export function PickerTrigger(
  props: ComponentProps<"button"> & {
    readonly label: string;
    readonly valueLabel: string;
    readonly loading: boolean;
  },
) {
  const { label, valueLabel, loading, className, ...rest } = props;

  return (
    <button
      type="button"
      disabled={loading}
      aria-label={loading ? label : `${label}: ${valueLabel}`}
      className={cn(
        "flex h-(--control-h) w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-left whitespace-nowrap fine-hover:hover:border-border-strong aria-expanded:border-accent disabled:bg-page disabled:text-text-disabled",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Skeleton className="h-2.5 w-24" />
      ) : (
        <span className="truncate">{valueLabel}</span>
      )}
      <Icon name="down" />
    </button>
  );
}

// The commodity, province and area pickers: the trigger above and an option list (.pop, .opt),
// in a popover or on a phone a bottom sheet.
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

  return (
    <PickerOverlay
      title={label}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <PickerTrigger
          label={label}
          valueLabel={valueLabel}
          loading={loading}
          aria-haspopup="listbox"
          className={className}
        />
      }
    >
      <OptionList
        entries={entries}
        value={value}
        label={label}
        className="max-h-[360px] max-sm:max-h-none max-sm:px-2 max-sm:pt-1 max-sm:pb-4"
        onSelect={(next) => {
          setOpen(false);
          onChange(next);
        }}
      />
    </PickerOverlay>
  );
}
