import { Dialog } from "radix-ui";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Icon } from "~/components/icon";

export const Sheet = Dialog.Root;

export const SheetTrigger = Dialog.Trigger;

// How far down a drag on the header must go to close the sheet.
const closeDragPx = 80;

// The bottom sheet, for phones. A scrim covers the page, the sheet slides up
// from the bottom edge, and the grab handle and title can be dragged down to close it. Radix moves
// focus in, returns it to the trigger and closes on the scrim, the close button or Escape.
export function SheetContent(props: {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}) {
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | undefined>(undefined);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("button") !== null) {
      return;
    }

    startY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (startY.current !== undefined) {
      setDrag(Math.max(0, event.clientY - startY.current));
    }
  };

  const onPointerUp = () => {
    startY.current = undefined;

    if (drag > closeDragPx) {
      props.onClose();
    }

    setDrag(0);
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-scrim-out data-[state=open]:animate-scrim-in" />
      <Dialog.Content
        aria-describedby={undefined}
        style={drag === 0 ? undefined : { transform: `translateY(${drag}px)` }}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] flex-col rounded-t-lg bg-card pb-[env(safe-area-inset-bottom)] shadow-pop outline-none data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in"
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex-none touch-none border-b border-border"
        >
          <div className="mx-auto mt-2 h-1 w-9 rounded-xs bg-border-strong" />
          <div className="flex items-center justify-between pt-1 pr-2 pb-2 pl-4">
            <Dialog.Title className="text-lg font-semibold">{props.title}</Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="flex size-11 items-center justify-center rounded-pill"
            >
              <Icon name="x" />
            </Dialog.Close>
          </div>
        </div>
        <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain">
          {props.children}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
