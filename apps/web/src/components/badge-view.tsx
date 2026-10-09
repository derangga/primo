import { Icon } from "~/components/icon";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { formatDate, type BadgeState } from "~/date-badge-state";

// Not interactive. The four states are drawn from DESIGN.UI.md, Date badge.
export function BadgeView(props: { readonly state: BadgeState }) {
  switch (props.state.kind) {
    case "loading":
      return (
        <Badge role="status" aria-label="Loading the newest data date" className="ml-auto">
          <Skeleton className="h-2.5 w-24" />
        </Badge>
      );

    case "fresh":
      return (
        <Badge role="status" className="ml-auto">
          <span className="size-1.5 rounded-full bg-accent" />
          <span>
            Data <b className="font-medium text-text">{formatDate(props.state.date)}</b>
          </span>
        </Badge>
      );

    case "stale":
      return (
        <Badge role="status" variant="warn" className="ml-auto">
          <Icon name="clock" />
          <span>
            Data <b className="font-medium">{formatDate(props.state.date)}</b>
            <span className="max-sm:hidden"> · {props.state.ageDays} days old</span>
          </span>
        </Badge>
      );

    case "error":
      return (
        <Badge role="status" variant="error" className="ml-auto">
          <Icon name="alert" />
          <span>Data unavailable</span>
        </Badge>
      );
  }
}
