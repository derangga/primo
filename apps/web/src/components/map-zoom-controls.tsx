import { Icon } from "~/components/icon";
import { Button } from "~/components/ui/button";

// One segmented control rather than three floating buttons: a single border and shadow over the map
// instead of three. Zoom in sits at the right end and never moves, so a second press never lands on
// a button that has just appeared under the finger.
const seam = "rounded-none border-0 shadow-none";

// The keyboard and screen reader route into the map's zoom. The map itself is not a tab stop (the
// province picker is), so these buttons are the only way in without a pointer.
//
// At the fitted view only zoom in can do anything, so it is the only one shown: on a phone the map
// is about 150 px tall and three buttons cover a third of it. Zoom out and reset join it once there
// is something to go back from.
export function MapZoomControls(props: {
  readonly zoomed: boolean;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onReset: () => void;
}) {
  return (
    <div className="absolute right-2 bottom-2 flex gap-px overflow-hidden rounded-md border border-border bg-border shadow-pop">
      {props.zoomed ? (
        <>
          <Button
            variant="icon"
            className={seam}
            aria-label="Reset the map"
            onClick={props.onReset}
          >
            <Icon name="fit" />
          </Button>
          <Button variant="icon" className={seam} aria-label="Zoom out" onClick={props.onZoomOut}>
            <Icon name="minus" />
          </Button>
        </>
      ) : null}
      <Button variant="icon" className={seam} aria-label="Zoom in" onClick={props.onZoomIn}>
        <Icon name="plus" />
      </Button>
    </div>
  );
}
