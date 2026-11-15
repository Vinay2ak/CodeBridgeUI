import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getInitialTheme, setTheme, Theme } from '../../lib/theme';

export const ThemeToggle: React.FC = () => {
  const [theme, setCurrentTheme] = useState<Theme>('dark');

  useEffect(() => {
    setCurrentTheme(getInitialTheme());
  }, []);

  const handleToggle = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setCurrentTheme(nextTheme);
  };

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className="p-2 rounded-md border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-raised transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
    >
      {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
    </button>
  );
};

