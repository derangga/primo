import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { Icon } from "~/components/icon";
import { cn } from "~/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// The popover surface. It fades in and scales from 0.97 at the trigger.
export function DropdownMenuContent(props: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const { className, sideOffset = 6, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-40 origin-(--radix-dropdown-menu-content-transform-origin) rounded-md border border-border bg-card p-1 text-text shadow-pop data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
          className,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

// .opt, with the check on the selected option.
export function DropdownMenuRadioItem(
  props: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>,
) {
  const { className, children, ...rest } = props;

  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        "flex min-h-8 cursor-default items-center justify-between gap-3 rounded-[6px] px-2.5 outline-none select-none data-highlighted:bg-hover data-[state=checked]:bg-accent-soft data-[state=checked]:font-medium data-[state=checked]:text-accent",
        className,
      )}
      {...rest}
    >
      {children}
      <DropdownMenuPrimitive.ItemIndicator>
        <Icon name="check" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}
