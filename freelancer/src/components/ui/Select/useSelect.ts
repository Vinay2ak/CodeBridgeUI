import { useState, useRef, useEffect, useCallback, useId } from "react";
import {
  firstEnabledIndex,
  moveIndex,
  homeIndex,
  endIndex,
  pageIndex,
  typeahead,
  placement,
} from "./logic";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  tone?: "success" | "primary" | "muted";
}

export interface UseSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  disabled?: boolean;
}

export function useSelect({
  id: externalId,
  value,
  onChange,
  onBlur,
  options,
  disabled,
}: UseSelectProps) {
  const generatedId = useId();
  const baseId = externalId || `cb-sel-${generatedId.replace(/:/g, "")}`;
  const listboxId = `${baseId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    side: "bottom" | "top";
    maxHeight: number;
  }>({
    top: 0,
    left: 0,
    width: 200,
    side: "bottom",
    maxHeight: 280,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const optionsContainerRef = useRef<HTMLDivElement | null>(null);
  const typeaheadBufferRef = useRef<string>("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = options.findIndex((opt) => opt.value === value);

  // Measure and position the popover
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();

    // Check if trigger has scrolled completely out of viewport
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    if (
      triggerRect.bottom < 0 ||
      triggerRect.top > viewportHeight ||
      triggerRect.right < 0 ||
      triggerRect.left > viewportWidth
    ) {
      setIsOpen(false);
      setIsClosing(false);
      return;
    }

    const estimatedListHeight = popoverRef.current
      ? popoverRef.current.scrollHeight
      : Math.min(280, options.length * 44 + 10);

    const place = placement({
      triggerRect,
      viewportHeight,
      listHeight: estimatedListHeight,
      gap: 6,
      margin: 12,
      maxHeight: 280,
    });

    const popoverWidth = Math.max(200, triggerRect.width);
    // Align left with trigger, ensure it does not overflow right viewport
    let left = triggerRect.left;
    if (left + popoverWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - popoverWidth - 8);
    }

    const top =
      place.side === "bottom"
        ? triggerRect.bottom + 6
        : triggerRect.top - 6 - Math.min(place.maxHeight, estimatedListHeight);

    setCoords({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(popoverWidth),
      side: place.side,
      maxHeight: place.maxHeight,
    });
  }, [options.length]);

  const openSelect = useCallback(() => {
    if (disabled || isOpen) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    const initialActive =
      selectedIndex !== -1 && !options[selectedIndex]?.disabled
        ? selectedIndex
        : firstEnabledIndex(options);

    setActiveIndex(initialActive);
    setIsClosing(false);
    setIsOpen(true);
  }, [disabled, isOpen, selectedIndex, options]);

  const closeSelect = useCallback(() => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    // Safety timeout in case animationend does not fire
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closeTimerRef.current = null;
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }, 200);
  }, [isOpen, isClosing]);

  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    if (isClosing && e.target === popoverRef.current) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsOpen(false);
      setIsClosing(false);
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }
  }, [isClosing]);

  const selectOption = useCallback(
    (index: number) => {
      const opt = options[index];
      if (!opt || opt.disabled) return;
      onChange(opt.value);
      closeSelect();
    },
    [options, onChange, closeSelect]
  );

  // Position updates while open
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener("resize", handleScrollOrResize);
      window.addEventListener("scroll", handleScrollOrResize, true);
      return () => {
        window.removeEventListener("resize", handleScrollOrResize);
        window.removeEventListener("scroll", handleScrollOrResize, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const isInsideTrigger = triggerRef.current?.contains(target);
      const isInsidePopover = popoverRef.current?.contains(target);

      if (!isInsideTrigger && !isInsidePopover) {
        closeSelect();
        onBlur?.();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, closeSelect, onBlur]);

  // Keep active option scrolled into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && popoverRef.current) {
      const optionEl = popoverRef.current.querySelector(
        `#${listboxId}-opt-${activeIndex}`
      ) as HTMLElement | null;
      if (optionEl) {
        optionEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, activeIndex, listboxId]);

  // Typeahead helper
  const handleTypeaheadKey = useCallback(
    (char: string) => {
      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current);
      }

      typeaheadBufferRef.current += char;
      const matchIndex = typeahead(options, activeIndex, typeaheadBufferRef.current);
      if (matchIndex !== -1) {
        setActiveIndex(matchIndex);
      }

      typeaheadTimerRef.current = setTimeout(() => {
        typeaheadBufferRef.current = "";
        typeaheadTimerRef.current = null;
      }, 500);
    },
    [options, activeIndex]
  );

  // Trigger keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openSelect();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => moveIndex(options, prev, 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => moveIndex(options, prev, -1));
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(homeIndex(options));
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(endIndex(options));
          break;
        case "PageDown":
          e.preventDefault();
          setActiveIndex((prev) => pageIndex(options, prev, "down"));
          break;
        case "PageUp":
          e.preventDefault();
          setActiveIndex((prev) => pageIndex(options, prev, "up"));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < options.length) {
            selectOption(activeIndex);
          }
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          closeSelect();
          break;
        case "Tab":
          // Select active and allow focus to move on naturally
          if (activeIndex >= 0 && activeIndex < options.length) {
            selectOption(activeIndex);
          } else {
            closeSelect();
          }
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleTypeaheadKey(e.key);
          }
          break;
      }
    },
    [disabled, isOpen, openSelect, closeSelect, options, activeIndex, selectOption, handleTypeaheadKey]
  );

  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

  return {
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
  };
}
