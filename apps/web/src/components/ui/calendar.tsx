import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { Icon } from "~/components/icon";
import { cn } from "~/lib/utils";

const navButton =
  "flex size-(--cell) items-center justify-center rounded-md fine-hover:hover:bg-hover aria-disabled:pointer-events-none aria-disabled:text-text-disabled";

// The shadcn Calendar over react-day-picker, drawn as .cal in design/components.css: a month name
// between two month buttons, a Su to Sa row, and day cells 44 px high (40 px from 640 px) that
// share the width, so the sheet is filled on a phone and the popover is seven cells wide. A day's
// look comes from data attributes on its cell, so hover never covers a selected or disabled day.
export function Calendar(props: ComponentProps<typeof DayPicker>) {
  const { className, classNames, ...rest } = props;

  return (
    <DayPicker
      weekStartsOn={0}
      showOutsideDays
      className={cn("w-full p-2 [--cell:44px] max-sm:px-4 max-sm:pb-4 sm:[--cell:40px]", className)}
      classNames={{
        months: "relative",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_caption: "flex h-(--cell) items-center justify-center text-lg font-semibold",
        month_grid: "w-full",
        weekdays: "flex",
        weekday:
          "flex h-7 min-w-(--cell) flex-1 items-center justify-center text-sm font-normal text-text-2",
        week: "flex",
        day: "group/day h-(--cell) min-w-(--cell) flex-1 p-0 text-center",
        day_button:
          "size-full rounded-md text-lg enabled:fine-hover:hover:bg-hover group-data-[selected=true]/day:bg-accent-soft group-data-[selected=true]/day:font-semibold group-data-[selected=true]/day:text-accent group-data-[today=true]/day:shadow-[inset_0_0_0_1px_var(--color-border-strong)] disabled:text-text-disabled",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => <Icon name={orientation === "left" ? "left" : "right"} />,
      }}
      {...rest}
    />
  );
}
