export type Theme = "light" | "dark";

export function useTheme() {
  const theme = useState<Theme>("theme", () => "light");

  function set(next: Theme) {
    theme.value = next;
    if (import.meta.client) {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        // ignore
      }
    }
  }

  function toggle() {
    set(theme.value === "dark" ? "light" : "dark");
  }

  function sync() {
    if (import.meta.client) {
      theme.value = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    }
  }

  return { theme, set, toggle, sync };
}
