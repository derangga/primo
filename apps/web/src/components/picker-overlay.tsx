import type { ReactElement, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { useMediaQuery } from "~/lib/use-media-query";

// What every picker opens: a popover under its trigger from 640 px and a bottom sheet titled
// `title` below that (DESIGN.UI.md, Pickers). The content focuses itself, so the popover does not
// move focus. The caller owns `open` and closes it when a value is picked.
export function PickerOverlay(props: {
  readonly title: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly trigger: ReactElement;
  readonly popoverClassName?: string;
  readonly children: ReactNode;
}) {
  const { title, open, onOpenChange, trigger, popoverClassName, children } = props;
  const phone = useMediaQuery("(max-width: 639px)");

  return phone ? (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent title={title} onClose={() => onOpenChange(false)}>
        {children}
      </SheetContent>
    </Sheet>
  ) : (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={popoverClassName}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
