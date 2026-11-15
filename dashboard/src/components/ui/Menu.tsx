import React, { useState, useRef, useEffect } from 'react';

export interface MenuItem {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  danger?: boolean;
}

export interface MenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  // Reset itemRefs array when items change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev < items.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.focus();
          return next;
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev > 0 ? prev - 1 : items.length - 1;
          itemRefs.current[next]?.focus();
          return next;
        });
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, items.length]);

  const toggle = () => {
    setIsOpen((prev) => {
      if (!prev) {
        setActiveIndex(0);
        setTimeout(() => {
          itemRefs.current[0]?.focus();
        }, 10);
      }
      return !prev;
    });
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-md"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 rounded-md bg-surface border border-border shadow-lg py-1 z-50 focus:outline-none`}
        >
          {items.map((item, index) => {
            const itemClasses = `flex items-center w-full px-4 py-2 text-sm transition-colors cursor-pointer text-left focus:outline-none focus-visible:outline-none ${
              activeIndex === index ? 'bg-surface-raised' : ''
            } ${
              item.danger
                ? 'text-danger hover:bg-danger/10'
                : 'text-text hover:bg-surface-raised'
            }`;

            if (item.href) {
              return (
                <a
                  key={item.label}
                  ref={(el) => (itemRefs.current[index] = el)}
                  role="menuitem"
                  tabIndex={-1}
                  href={item.href}
                  className={itemClasses}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && <span className="mr-2.5">{item.icon}</span>}
                  {item.label}
                </a>
              );
            }

            return (
              <button
                key={item.label}
                ref={(el) => (itemRefs.current[index] = el)}
                role="menuitem"
                type="button"
                tabIndex={-1}
                className={itemClasses}
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                  item.onClick?.();
                }}
              >
                {item.icon && <span className="mr-2.5">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

