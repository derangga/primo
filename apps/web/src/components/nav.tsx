import { Link } from "@tanstack/react-router";
import { Icon, type IconName } from "~/components/icon";

const tabs: ReadonlyArray<{
  to: "/" | "/chart" | "/purchasing-power";
  label: string;
  icon: IconName;
}> = [
  { to: "/", label: "Map", icon: "nav-map" },
  { to: "/chart", label: "Chart", icon: "nav-chart" },
  { to: "/purchasing-power", label: "Purchasing Power", icon: "nav-power" },
];

// Pill tabs in the header from 640 px. Below that the same links are a fixed bottom navigation
// bar, 64 px high plus the safe area, with an icon above each label.
export function Nav() {
  return (
    <nav
      aria-label="Views"
      className="fixed inset-x-0 bottom-0 z-10 flex h-[calc(64px+env(safe-area-inset-bottom))] gap-1 border-t border-border bg-card px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] sm:static sm:z-auto sm:h-auto sm:gap-0.5 sm:rounded-pill sm:border-t-0 sm:bg-page sm:p-[3px]"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          activeOptions={{ exact: true }}
          className="inline-flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-sm font-medium whitespace-nowrap text-text-2 no-underline aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent fine-hover:hover:bg-hover fine-hover:hover:text-text sm:h-[34px] sm:flex-none sm:flex-row sm:rounded-pill sm:px-3.5 sm:text-md sm:aria-[current=page]:bg-accent sm:aria-[current=page]:text-on-accent fine-hover:sm:aria-[current=page]:hover:bg-accent fine-hover:sm:aria-[current=page]:hover:text-on-accent"
        >
          <Icon name={tab.icon} className="size-[18px] sm:hidden" />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
