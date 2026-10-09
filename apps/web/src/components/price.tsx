import { cn } from "~/lib/utils";
import { changeBetween, formatRupiah, type Change } from "~/format";

const sizes = {
  xl: "text-(length:--num-xl)",
  lg: "text-(length:--num-lg)",
  md: "text-(length:--num-md)",
  // A stat tile: --num-md on a phone, where the tiles are a 2 by 2 grid, --num-lg from 640 px.
  tile: "text-(length:--num-md) sm:text-(length:--num-lg)",
};

// "Rp 16.400/kg": "Rp" at weight 400 in secondary text, the figure at
// 600, and "/kg" at 0.45 of the figure on the headline size and 13 px on the smaller ones.
export function Price(props: {
  readonly rupiah: number;
  readonly size: keyof typeof sizes;
  readonly unit?: boolean;
}) {
  return (
    <span
      // The size goes first: tailwind-merge drops an earlier leading-* when a later text size follows it.
      className={cn(
        sizes[props.size],
        "leading-(--leading-num) font-semibold tracking-[-0.01em] whitespace-nowrap",
      )}
    >
      <span className="font-normal text-text-2">Rp</span> {formatRupiah(props.rupiah)}
      {props.unit === true ? (
        <span
          className={cn(
            "ml-0.5 font-normal tracking-normal text-text-2",
            props.size === "xl" ? "text-[0.45em]" : "text-[13px]",
          )}
        >
          /kg
        </span>
      ) : null}
    </span>
  );
}

const tone = {
  up: "text-(--delta-up)",
  down: "text-(--delta-down)",
  flat: "text-text-2",
};

// The change of `value` against `reference`: colour, an arrow, a sign, rupiah then percent.
export function Delta(props: {
  readonly value: number;
  readonly reference: number;
  // "rupiah" leaves the percent out, for a tile that shows it as its figure.
  readonly show?: "rupiah" | "both";
}) {
  const change: Change = changeBetween(props.value, props.reference);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[13px] font-medium whitespace-nowrap",
        tone[change.direction],
      )}
    >
      {change.direction === "flat" ? null : (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d={change.direction === "up" ? "M5 1l4 7H1z" : "M5 9l4-7H1z"} fill="currentColor" />
        </svg>
      )}
      {props.show === "rupiah" ? change.rupiah : change.text}
    </span>
  );
}
