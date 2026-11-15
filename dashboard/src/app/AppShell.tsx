import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Menu as MenuIcon,
  X,
  LogOut,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { useSession, logout } from '../features/session/session';
import { env } from '../lib/env';
import { Chip } from '../components/ui/Chip';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Menu } from '../components/ui/Menu';
import { LivePill } from '../components/dashboard/LivePill';
import { NotificationBell } from '../components/dashboard/NotificationBell';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: 'Projects', href: '#projects' },
  { label: 'Payments', href: '#payments' },
  { label: 'Activity', href: '#activity' },
  { label: 'Settings', href: '#settings' },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Esc closes mobile drawer and returns focus to menu button
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const navContent = (
    <nav aria-label="Section navigation" className="flex flex-col gap-1 p-3">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className="px-3 py-2 text-sm font-medium rounded-md text-text-muted hover:text-text hover:bg-surface-raised transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Fixed sidebar for desktop >= 1024px */}
      <aside
        aria-label="Sidebar navigation"
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface"
      >
        <div className="flex h-16 items-center px-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">CodeBridge</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">{navContent}</div>
      </aside>

      {/* Slide-over drawer for < 1024px */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          className="lg:hidden fixed inset-0 z-50 flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsMobileMenuOpen(false);
              mobileMenuButtonRef.current?.focus();
            }}
          />

          {/* Drawer content */}
          <div
            ref={drawerRef}
            className="relative flex flex-col w-64 max-w-xs bg-surface border-r border-border shadow-2xl z-10"
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                <span className="font-bold text-base">CodeBridge</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  mobileMenuButtonRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">{navContent}</div>
          </div>
        </div>
      )}

      {/* Main application wrapper */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Semantic Header / Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 sm:px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden p-2 rounded-md border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold truncate text-text">
              Project Owner Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <LivePill />
            <NotificationBell />
            <ThemeToggle />

            {/* User Menu */}
            <Menu
              align="right"
              trigger={
                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-raised transition-colors cursor-pointer border border-transparent hover:border-border">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'O'}
                  </div>
                  <span className="hidden md:inline-block text-sm font-medium max-w-[120px] truncate text-text">
                    {user?.displayName || 'Project Owner'}
                  </span>
                  <div className="hidden sm:inline-block">
                    <Chip
                      label="Project Owner"
                      tone="neutral"
                      size="sm"
                    />
                  </div>
                </div>
              }
              items={[
                {
                  label: 'Settings',
                  href: '#settings',
                  icon: <Settings className="w-4 h-4 text-text-muted" />,
                },
                {
                  label: 'Account',
                  href: env.VITE_ACCOUNT_URL,
                  icon: <ExternalLink className="w-4 h-4 text-text-muted" />,
                },
                {
                  label: 'Sign out',
                  onClick: logout,
                  icon: <LogOut className="w-4 h-4" />,
                  danger: true,
                },
              ]}
            />
          </div>
        </header>

        {/* Semantic Main Content Area with max-w-7xl and 24px gaps (gap-6) */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
