import { Icon } from "~/components/icon";
import { Button } from "~/components/ui/button";

// DESIGN.UI.md, Error message: an alert icon, the title, one line and a Retry button. While the retry
// runs the button is disabled and reads "Retrying". Callers place it: over the map's outlines, or
// centred in the card that replaces the Chart tab's tiles and chart.
export function ErrorMessage(props: { readonly retrying: boolean; readonly onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 text-center text-text-2">
      <div className="flex items-center gap-1.5 font-medium text-text">
        <Icon name="alert" className="text-error" />
        Couldn&apos;t load prices
      </div>
      <p>Check your connection, then try again.</p>
      <Button disabled={props.retrying} onClick={props.onRetry}>
        {props.retrying ? "Retrying" : "Retry"}
      </Button>
    </div>
  );
}
