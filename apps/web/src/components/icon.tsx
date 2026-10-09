import { cn } from "~/lib/utils";

// Paths from the symbols in design/mockups, drawn in a 14 px box.
const paths = {
  "nav-map": "M1.5 3.5l3.5-1.5 4 1.5 3.5-1.5v8.5l-3.5 1.5-4-1.5-3.5 1.5zM5 2v9M9 3.5v9",
  "nav-chart": "M1.5 12.5h11M2 9.5l3-3 2.5 2 4-4.5",
  "nav-power": "M3 5h8l-.8 7.5H3.8zM5 5V4a2 2 0 0 1 4 0v1",
  sun: "M7 4.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zM7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1 1M10.2 10.2l1 1M2.8 11.2l1-1M10.2 3.8l1-1",
  moon: "M11.5 8.2A5 5 0 0 1 5.8 2.5a5 5 0 1 0 5.7 5.7z",
  system:
    "M2.7 2.5h8.6a1.2 1.2 0 0 1 1.2 1.2v5.1a1.2 1.2 0 0 1-1.2 1.2H2.7a1.2 1.2 0 0 1-1.2-1.2V3.7a1.2 1.2 0 0 1 1.2-1.2zM5 12.5h4M7 10v2.5",
  check: "M3 7.5l2.8 2.8L11 4.5",
  clock: "M7 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM7 4v3.2l2 1.3",
  alert: "M7 1.8l5.6 10H1.4zM7 6v2.6M7 10.4v.1",
};

export type IconName = keyof typeof paths;

export function Icon(props: { readonly name: IconName; readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className={cn(
        "size-3.5 shrink-0 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]",
        props.className,
      )}
    >
      <path d={paths[props.name]} />
    </svg>
  );
}
