export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "cb-theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return "dark";
}

export function updateMetaThemeColor(): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  if (bg) {
    meta.setAttribute("content", bg);
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateMetaThemeColor();
}

export function toggleTheme(currentTheme: Theme): Theme {
  const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  return nextTheme;
}

