import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/Button";
import { getTheme, toggleTheme, type Theme } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Button
      variant="ghost"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className="px-2.5 py-2"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
