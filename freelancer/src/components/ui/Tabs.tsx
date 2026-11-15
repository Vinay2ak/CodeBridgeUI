import React, { useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Navigation tabs",
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === "ArrowRight") {
      targetIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = tabs.length - 1;
    }

    if (targetIndex >= 0) {
      e.preventDefault();
      const tabButtons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (tabButtons && tabButtons[targetIndex]) {
        tabButtons[targetIndex].focus();
        onChange(tabs[targetIndex].id);
      }
    }
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 p-1 rounded-lg bg-raised border border-line"
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink hover:bg-surface"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
};

