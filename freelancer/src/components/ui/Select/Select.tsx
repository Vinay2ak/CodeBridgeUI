import React, { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { useSelect, SelectOption } from "./useSelect";

export type { SelectOption };

export interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  size?: "md" | "sm";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  id,
  value,
  onChange,
  onBlur,
  name,
  options,
  placeholder = "Select…",
  disabled = false,
  invalid = false,
  required = false,
  size = "md",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  className = "",
}) => {
  const {
    baseId,
    listboxId,
    isOpen,
    isClosing,
    activeIndex,
    setActiveIndex,
    selectedIndex,
    coords,
    triggerRef,
    popoverRef,
    optionsContainerRef,
    activeOptionId,
    openSelect,
    closeSelect,
    selectOption,
    handleKeyDown,
    handleAnimationEnd,
  } = useSelect({
    id,
    value,
    onChange,
    onBlur,
    options,
    disabled,
  });

  const selectedOption = selectedIndex !== -1 ? options[selectedIndex] : undefined;

  // Track sliding highlight position and height
  const [highlightStyle, setHighlightStyle] = useState<{
    top: number;
    height: number;
    opacity: number;
  }>({
    top: 0,
    height: 0,
    opacity: 0,
  });

  useLayoutEffect(() => {
    if (!isOpen || activeIndex < 0 || !popoverRef.current) {
      setHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const activeEl = popoverRef.current.querySelector(
      `#${listboxId}-opt-${activeIndex}`
    ) as HTMLElement | null;

    if (activeEl) {
      setHighlightStyle({
        top: activeEl.offsetTop,
        height: activeEl.offsetHeight,
        opacity: 1,
      });
    }
  }, [isOpen, activeIndex, listboxId]);

  // Determine portal target: closest role="dialog" or document.body
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (triggerRef.current) {
      const dialog = triggerRef.current.closest<HTMLElement>('[role="dialog"]');
      setPortalNode(dialog || document.body);
    } else {
      setPortalNode(document.body);
    }
  }, []);

  const triggerClasses = [
    "cb-select-trigger",
    size === "sm" ? "cb-select-sm" : "",
    isOpen ? "cb-select-open" : "",
    invalid ? "cb-select-invalid" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-invalid={invalid ? "true" : undefined}
        aria-required={required ? "true" : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        disabled={disabled}
        onClick={() => (isOpen ? closeSelect() : openSelect())}
        onKeyDown={handleKeyDown}
        className={triggerClasses}
      >
        <span className="cb-select-trigger-content">
          {selectedOption?.tone && (
            <span
              className={`cb-select-tone-dot cb-select-tone-${selectedOption.tone}`}
              aria-hidden="true"
            />
          )}
          <span
            key={value}
            className={`cb-select-trigger-label ${
              !selectedOption ? "cb-select-placeholder" : ""
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown className="cb-select-chevron" aria-hidden="true" />
      </button>

      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          aria-hidden="true"
        />
      )}

      {(isOpen || isClosing) &&
        portalNode &&
        createPortal(
          <div
            ref={popoverRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={ariaLabelledby || baseId}
            data-side={coords.side}
            className={`cb-select-popover ${isClosing ? "cb-select-closing" : ""}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
            }}
            onAnimationEnd={handleAnimationEnd}
          >
            <div ref={optionsContainerRef} className="cb-select-options-list">
              {/* Sliding Highlight */}
              <div
                className="cb-select-highlight"
                style={{
                  top: `${highlightStyle.top}px`,
                  height: `${highlightStyle.height}px`,
                  opacity: highlightStyle.opacity,
                }}
                aria-hidden="true"
              />

              {options.map((opt, index) => {
                const isSelected = opt.value === value;
                const optionId = `${listboxId}-opt-${index}`;

                return (
                  <div
                    key={opt.value}
                    id={optionId}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled ? "true" : undefined}
                    data-index={index < 8 ? index : undefined}
                    data-active={activeIndex === index ? "true" : undefined}
                    className="cb-select-option"
                    onPointerEnter={() => {
                      if (!opt.disabled) {
                        setActiveIndex(index);
                      }
                    }}
                    onClick={() => {
                      if (!opt.disabled) {
                        selectOption(index);
                      }
                    }}
                  >
                    <div className="cb-select-option-content">
                      {opt.tone && (
                        <span
                          className={`cb-select-tone-dot cb-select-tone-${opt.tone}`}
                          aria-hidden="true"
                        />
                      )}
                      <div className="cb-select-option-text">
                        <span className="cb-select-option-label">{opt.label}</span>
                        {opt.description && (
                          <span className="cb-select-option-description">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="cb-select-check-icon" aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>,
          portalNode
        )}
    </>
  );
};
