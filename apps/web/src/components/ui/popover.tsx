import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = PopoverPrimitive.Trigger;

// .pop from design/components.css. It fades in and scales from 0.97 at the trigger.
export function PopoverContent(props: ComponentProps<typeof PopoverPrimitive.Content>) {
  const { className, sideOffset = 6, align = "start", ...rest } = props;

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-(--radix-popover-trigger-width) origin-(--radix-popover-content-transform-origin) rounded-md border border-border bg-card p-1 text-text shadow-pop data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
          className,
        )}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
}
