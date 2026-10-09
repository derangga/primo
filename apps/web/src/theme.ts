export type ThemeSetting = "system" | "light" | "dark";

export const themeSettings: ReadonlyArray<ThemeSetting> = ["system", "light", "dark"];

export const themeLabels: Record<ThemeSetting, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const storageKey = "theme";

const listeners = new Set<() => void>();

export function parseThemeSetting(value: string | null): ThemeSetting {
  return themeSettings.find((setting) => setting === value) ?? "system";
}

export function readThemeSetting(): ThemeSetting {
  try {
    return parseThemeSetting(localStorage.getItem(storageKey));
  } catch {
    return "system";
  }
}

function apply(setting: ThemeSetting) {
  const dark =
    setting === "dark" ||
    (setting === "system" && matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.dataset["theme"] = dark ? "dark" : "light";
  document.documentElement.dataset["setting"] = setting;
}

export function setThemeSetting(setting: ThemeSetting) {
  try {
    localStorage.setItem(storageKey, setting);
  } catch {
    // Storage is blocked: the choice applies until the page reloads.
  }

  apply(setting);
  listeners.forEach((listener) => listener());
}

// For useSyncExternalStore. While the setting is "system" the operating system's theme changes the
// page, and another tab changing the stored setting changes this one.
export function subscribeThemeSetting(onChange: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");

  const onSystemChange = () => {
    const setting = readThemeSetting();

    if (setting === "system") {
      apply(setting);
    }
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      apply(readThemeSetting());
      onChange();
    }
  };

  listeners.add(onChange);
  media.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
  };
}
