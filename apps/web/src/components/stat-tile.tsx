import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";

// An overline label, one figure and one supporting line.
export function StatTile(props: {
  readonly label: string;
  readonly figure: ReactNode;
  readonly support: ReactNode;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-2">
      <div className="text-xs font-medium tracking-[0.06em] text-text-2 uppercase">
        {props.label}
      </div>
      {props.figure}
      <div className="text-sm text-text-2">{props.support}</div>
    </Card>
  );
}
