import { useSyncExternalStore } from "react";
import { Icon, type IconName } from "~/components/icon";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  parseThemeSetting,
  readThemeSetting,
  setThemeSetting,
  subscribeThemeSetting,
  themeLabels,
  themeSettings,
  type ThemeSetting,
} from "~/theme";

const icons: Record<ThemeSetting, IconName> = { system: "system", light: "sun", dark: "moon" };

// The prerendered page cannot know the setting, so the trigger draws all three icons and the
// data-setting attribute set by the head script picks one before first paint.
const iconVisibility: Record<ThemeSetting, string> = {
  system: "block in-data-[setting=light]:hidden in-data-[setting=dark]:hidden",
  light: "hidden in-data-[setting=light]:block",
  dark: "hidden in-data-[setting=dark]:block",
};

const readServerThemeSetting = (): ThemeSetting => "system";

export function ThemeSwitcher() {
  const setting = useSyncExternalStore(
    subscribeThemeSetting,
    readThemeSetting,
    readServerThemeSetting,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="round" aria-label={`Theme: ${themeLabels[setting]}`}>
          {themeSettings.map((option) => (
            <Icon key={option} name={icons[option]} className={iconVisibility[option]} />
          ))}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={setting}
          onValueChange={(value) => setThemeSetting(parseThemeSetting(value))}
        >
          {themeSettings.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {themeLabels[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
