import { DateBadge } from "~/components/date-badge";
import { ThemeSwitcher } from "~/components/theme-switcher";

export function Header() {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-border bg-card px-4 py-2.5 sm:gap-x-6 sm:gap-y-3 sm:px-6">
      <div className="text-lg font-semibold whitespace-nowrap">Food Price Monitor</div>
      <DateBadge />
      <ThemeSwitcher />
    </header>
  );
}
