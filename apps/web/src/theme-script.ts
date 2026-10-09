// Runs in <head> before first paint. It resolves the stored setting with prefers-color-scheme and
// sets data-theme (the resolved theme) and data-setting (what the switcher shows) on <html>.
// A plain string, because it must run before any bundle loads.
export const themeScript = `(function () {
  var setting = "system";
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setting = stored;
    }
  } catch (_) {}
  var dark = setting === "dark" || (setting === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.setting = setting;
})();`;
