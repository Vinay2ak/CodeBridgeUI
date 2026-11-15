import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getInitialTheme, toggleTheme, Theme } from "../../lib/theme";

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  const handleToggle = () => {
    const next = toggleTheme(theme);
    setTheme(next);
  };

  const isDark = theme === "dark";
  const ariaLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-flex items-center justify-center rounded-lg h-9 w-9 text-ink hover:bg-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-cream" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
      )}
    </button>
  );
};

