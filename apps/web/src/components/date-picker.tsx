import type { IsoDate } from "@primo/contract/schemas";
import { useMemo, useState } from "react";
import { PickerOverlay } from "~/components/picker-overlay";
import { PickerTrigger } from "~/components/picker";
import { Calendar } from "~/components/ui/calendar";
import { formatDateWithWeekday, localDay, localDayKey } from "~/date-entries";

// A month calendar where only the days that have data can be picked. The month buttons stop at the
// oldest and newest month with data, and the days of the neighbouring months are drawn disabled.
// It mounts when its container opens, so each opening starts on the selected day's month.
function DateCalendar(props: {
  readonly dates: ReadonlyArray<IsoDate>;
  readonly date: IsoDate;
  readonly onSelect: (date: IsoDate) => void;
}) {
  const { dates, date, onSelect } = props;
  const byKey = useMemo(() => new Map<string, IsoDate>(dates.map((each) => [each, each])), [dates]);
  const [month, setMonth] = useState(() => localDay(date));

  // `dates` is oldest first and holds the selected date, so the fallbacks never apply.
  const oldest = dates[0] ?? date;
  const newest = dates.at(-1) ?? date;

  return (
    <Calendar
      mode="single"
      required
      autoFocus
      selected={localDay(date)}
      month={month}
      onMonthChange={setMonth}
      startMonth={localDay(oldest)}
      endMonth={localDay(newest)}
      disabled={(day) => day.getMonth() !== month.getMonth() || !byKey.has(localDayKey(day))}
      onSelect={(day) => {
        const picked = byKey.get(localDayKey(day));

        if (picked !== undefined) {
          onSelect(picked);
        }
      }}
    />
  );
}

// The date trigger and its calendar (.ctl, .cal). Picking a day closes it.
export function DatePicker(props: {
  readonly dates: ReadonlyArray<IsoDate> | undefined;
  readonly date: IsoDate | undefined;
  readonly onChange: (date: IsoDate) => void;
  readonly className?: string;
}) {
  const { dates, date, onChange, className } = props;
  const [open, setOpen] = useState(false);

  const trigger = (
    <PickerTrigger
      label="Date"
      valueLabel={date === undefined ? "" : formatDateWithWeekday(date)}
      loading={dates === undefined || date === undefined}
      className={className}
    />
  );

  if (dates === undefined || date === undefined) {
    return trigger;
  }

  const calendar = (
    <DateCalendar
      dates={dates}
      date={date}
      onSelect={(next) => {
        setOpen(false);
        onChange(next);
      }}
    />
  );

  return (
    <PickerOverlay
      title="Date"
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      popoverClassName="w-auto p-0"
    >
      {calendar}
    </PickerOverlay>
  );
}
