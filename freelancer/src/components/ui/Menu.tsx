import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

export interface MenuProps {
  triggerLabel: React.ReactNode;
  items: MenuItem[];
}

export const Menu: React.FC<MenuProps> = ({ triggerLabel, items }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggle = () => setOpen((prev) => !prev);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const focusable = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (!focusable || focusable.length === 0) return;

        const currentIndex = Array.from(focusable).indexOf(document.activeElement as HTMLElement);
        let nextIndex = 0;
        if (e.key === "ArrowDown") {
          nextIndex = currentIndex >= 0 ? (currentIndex + 1) % focusable.length : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1;
        }
        focusable[nextIndex].focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span>{triggerLabel}</span>
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-line bg-raised p-1 shadow-md z-40 focus:outline-none"
        >
          {items.map((item, idx) => {
            const className = `flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              item.danger
                ? "text-danger hover:bg-danger-bg hover:text-danger"
                : "text-ink hover:bg-surface"
            }`;

            if (item.href) {
              return (
                <a
                  key={idx}
                  role="menuitem"
                  href={item.href}
                  className={className}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              );
            }

            return (
              <button
                key={idx}
                role="menuitem"
                type="button"
                className={className}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

