import type { IsoDate } from "@primo/contract/schemas";
import { Match } from "effect";
import type { KeyboardEvent } from "react";
import { Icon } from "~/components/icon";
import { DatePicker } from "~/components/date-picker";
import { Field } from "~/components/picker";
import { Button } from "~/components/ui/button";
import { stepDate } from "~/view-params";

// Previous, the date picker, next and Latest (DESIGN.UI.md, Date control). `dates` is the API's
// list, oldest first, and undefined while it loads. `onChange` gets undefined for Latest, which
// clears the date from the URL so the link keeps meaning "the newest".
export function DateControl(props: {
  readonly dates: ReadonlyArray<IsoDate> | undefined;
  readonly date: IsoDate | undefined;
  readonly onChange: (date: IsoDate | undefined) => void;
}) {
  const { dates, date, onChange } = props;

  const ready = dates !== undefined && date !== undefined;
  const older = ready ? stepDate(dates, date, -1) : undefined;
  const newer = ready ? stepDate(dates, date, 1) : undefined;

  const onKeyDown = (event: KeyboardEvent) => {
    // A calendar in the popover or sheet is portaled but its events still bubble here, so only the control's own DOM counts.
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) {
      return;
    }

    const target = Match.value(event.key).pipe(
      Match.when("ArrowLeft", () => older),
      Match.when("ArrowRight", () => newer),
      Match.orElse(() => undefined),
    );

    if (target !== undefined) {
      event.preventDefault();
      onChange(target);
    }
  };

  return (
    <Field label="Date">
      <div
        role="group"
        aria-label="Date"
        onKeyDown={onKeyDown}
        className="flex items-center gap-1 max-sm:w-full"
      >
        <Button
          variant="icon"
          aria-label="Previous date"
          disabled={older === undefined}
          onClick={() => older !== undefined && onChange(older)}
        >
          <Icon name="left" />
        </Button>
        <DatePicker
          dates={dates}
          date={date}
          className="max-sm:min-w-0 max-sm:flex-1 sm:w-44"
          onChange={onChange}
        />
        <Button
          variant="icon"
          aria-label="Next date"
          disabled={newer === undefined}
          onClick={() => newer !== undefined && onChange(newer)}
        >
          <Icon name="right" />
        </Button>
        <Button disabled={newer === undefined} onClick={() => onChange(undefined)}>
          Latest
        </Button>
      </div>
    </Field>
  );
}
