import { useEffect, useState, type PointerEvent } from "react";
import { provinces } from "@primo/contract/reference";
import type { IsoDate } from "@primo/contract/schemas";
import { provinceName } from "~/areas";
import { bucket, powerFill } from "~/buckets";
import { ErrorMessage } from "~/components/error-message";
import { PowerTip } from "~/components/power-tip";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { formatKilograms } from "~/format";
import type { Power, PowerRow } from "~/purchasing-power";

// One row is a name, a bar and a value on a line; below 640 px it is the name and value on one line
// and the bar full width on the next (DESIGN.UI.md, Ranking row). The median overlay uses the same
// grid so its line falls where the bars' shared zero and scale put it.
const grid =
  "grid grid-cols-[180px_minmax(0,1fr)_64px] gap-x-3 px-1.5 text-[13px] [grid-template-areas:'name_bar_val'] max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:[grid-template-areas:'name_val'_'bar_bar']";

const row = `${grid} h-7 items-center rounded-sm max-sm:h-auto max-sm:gap-y-[3px] max-sm:py-[5px]`;

type Hover = { areaId: number; x: number; y: number; left: boolean; up: boolean };

// The tooltip follows the pointer on a mouse and appears on a tap; a tap outside the rows hides it.
function useRankHover() {
  const [hover, setHover] = useState<Hover | null>(null);
  const open = hover !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const hide = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Element) || event.target.closest("[data-rank]") === null) {
        setHover(null);
      }
    };

    document.addEventListener("pointerdown", hide);

    return () => document.removeEventListener("pointerdown", hide);
  }, [open]);

  const show = (areaId: number) => (event: PointerEvent) => {
    setHover({
      areaId,
      x: event.clientX,
      y: event.clientY,
      left: event.clientX + 270 > window.innerWidth,
      up: event.clientY + 130 > window.innerHeight,
    });
  };

  const hide = (event: PointerEvent) => event.pointerType !== "touch" && setHover(null);

  return { hover, show, hide };
}

function RankTip(props: { readonly hover: Hover; readonly power: Power; readonly date: IsoDate }) {
  const { hover, power } = props;
  const found = power.rows.find((r) => r.areaId === hover.areaId);

  return (
    <div
      className="pointer-events-none fixed z-20"
      style={{
        left: hover.left ? hover.x - 12 : hover.x + 12,
        top: hover.up ? hover.y - 12 : hover.y + 12,
        transform: `translate(${hover.left ? "-100%" : "0"}, ${hover.up ? "-100%" : "0"})`,
      }}
    >
      <PowerTip
        areaId={hover.areaId}
        row={found}
        bucket={bucket(found?.kg, power.median)}
        date={props.date}
      />
    </div>
  );
}

// The bars of the 34 provinces, as plain rows (not a chart).
export function RankingCard(props: {
  readonly title: string;
  readonly power: Power | undefined;
  readonly date: IsoDate | undefined;
  readonly dimmed: boolean;
  readonly failed: boolean;
  readonly retrying: boolean;
  readonly onRetry: () => void;
}) {
  const { power, date } = props;
  const { hover, show, hide } = useRankHover();

  return (
    <Card aria-label="Ranking" className="px-2.5 py-4">
      <CardHeader className="px-1.5">
        <CardTitle>{props.title}</CardTitle>
        <span className="text-sm whitespace-nowrap text-text-2">
          kg, {provinces.length} provinces
        </span>
      </CardHeader>
      {props.failed ? (
        <div className="flex min-h-80 items-center justify-center">
          <ErrorMessage retrying={props.retrying} onRetry={props.onRetry} />
        </div>
      ) : power === undefined ? (
        <RankingSkeleton />
      ) : (
        <div className={props.dimmed ? "opacity-60" : undefined}>
          <Rows power={power} hoveredId={hover?.areaId} onShow={show} onHide={hide} />
          <Unpriced power={power} />
        </div>
      )}
      {hover === null || date === undefined || power === undefined ? null : (
        <RankTip hover={hover} power={power} date={date} />
      )}
    </Card>
  );
}

// The provinces with no price, then the label of the median line above them.
function Unpriced(props: { readonly power: Power }) {
  const { power } = props;

  return (
    <>
      {power.missing.map((areaId) => (
        <div key={areaId} className={cn(row, "text-text-2")}>
          <span className="truncate [grid-area:name]">{provinceName(areaId)}</span>
          <span className="[grid-area:bar]">No data</span>
        </div>
      ))}
      {power.median === null ? null : (
        <div className="flex items-center gap-2 px-1.5 pt-2 text-sm text-text-2">
          <i className="block h-3.5 w-px bg-text" />
          Median province, {formatKilograms(power.median)} kg
        </div>
      )}
    </>
  );
}

function Rows(props: {
  readonly power: Power;
  readonly hoveredId: number | undefined;
  readonly onShow: (areaId: number) => (event: PointerEvent) => void;
  readonly onHide: (event: PointerEvent) => void;
}) {
  const { power } = props;

  return (
    <div className="relative">
      {power.rows.map((r) => (
        <RankRow
          key={r.areaId}
          row={r}
          power={power}
          hovered={props.hoveredId === r.areaId}
          onShow={props.onShow(r.areaId)}
          onHide={props.onHide}
        />
      ))}
      {power.median === null || power.max === 0 ? null : (
        <div
          aria-hidden="true"
          className={cn(
            grid,
            "pointer-events-none absolute inset-0 grid-rows-1 items-stretch max-sm:grid-rows-[0_minmax(0,1fr)]",
          )}
        >
          <span className="[grid-area:name]" />
          <div className="relative [grid-area:bar]">
            <i
              className="absolute inset-y-0 w-px bg-text"
              style={{ left: `${(power.median / power.max) * 100}%` }}
            />
          </div>
          <span className="[grid-area:val]" />
        </div>
      )}
    </div>
  );
}

function RankRow(props: {
  readonly row: PowerRow;
  readonly power: Power;
  readonly hovered: boolean;
  readonly onShow: (event: PointerEvent) => void;
  readonly onHide: (event: PointerEvent) => void;
}) {
  const { row: r, power } = props;

  return (
    <div
      data-rank=""
      className={cn(row, "fine-hover:hover:bg-hover", props.hovered && "bg-hover")}
      onPointerMove={(event) => event.pointerType !== "touch" && props.onShow(event)}
      onPointerDown={(event) => event.pointerType === "touch" && props.onShow(event)}
      onPointerLeave={props.onHide}
    >
      <span className="truncate [grid-area:name]">{provinceName(r.areaId)}</span>
      <div className="[grid-area:bar]">
        <div
          className="h-3 rounded-r-sm max-sm:h-2"
          style={{
            width: `${(r.kg / power.max) * 100}%`,
            background: powerFill[bucket(r.kg, power.median)],
          }}
        />
      </div>
      <span className="text-right font-medium whitespace-nowrap [grid-area:val]">
        {formatKilograms(r.kg)} kg
      </span>
    </div>
  );
}

// Thirty-four rows of the loaded layout, so nothing moves when the figures arrive.
function RankingSkeleton() {
  return (
    <div aria-hidden="true">
      {provinces.map((province, index) => (
        <div key={province.id} className={row}>
          <Skeleton className="h-3 w-24 [grid-area:name]" />
          <div className="[grid-area:bar]">
            <Skeleton className="h-3 max-sm:h-2" style={{ width: `${100 - index * 1.4}%` }} />
          </div>
          <Skeleton className="ml-auto h-3 w-10 [grid-area:val]" />
        </div>
      ))}
    </div>
  );
}
