export interface SelectOptionLike {
  value?: string;
  label: string;
  disabled?: boolean;
}

export interface TriggerRectLike {
  top: number;
  bottom: number;
  left?: number;
  right?: number;
  width?: number;
  height?: number;
}

export interface PlacementOptions {
  triggerRect: TriggerRectLike;
  viewportHeight: number;
  listHeight: number;
  gap?: number;
  margin?: number;
  maxHeight?: number;
}

export interface PlacementResult {
  side: "bottom" | "top";
  maxHeight: number;
}

/**
 * Returns the index of the first non-disabled option, or -1 if none.
 */
export function firstEnabledIndex<T extends SelectOptionLike>(options: T[]): number {
  for (let i = 0; i < options.length; i++) {
    if (!options[i].disabled) {
      return i;
    }
  }
  return -1;
}

/**
 * Returns the index of the first non-disabled option (alias).
 */
export function homeIndex<T extends SelectOptionLike>(options: T[]): number {
  return firstEnabledIndex(options);
}

/**
 * Returns the index of the last non-disabled option, or -1 if none.
 */
export function endIndex<T extends SelectOptionLike>(options: T[]): number {
  for (let i = options.length - 1; i >= 0; i--) {
    if (!options[i].disabled) {
      return i;
    }
  }
  return -1;
}

/**
 * Moves from a given index by `delta` enabled steps.
 * Skips disabled options, clamps at both boundaries without wrapping.
 */
export function moveIndex<T extends SelectOptionLike>(
  options: T[],
  from: number,
  delta: number
): number {
  if (!options || options.length === 0) return -1;
  const firstEnabled = firstEnabledIndex(options);
  if (firstEnabled === -1) return -1;

  if (delta === 0) {
    if (from >= 0 && from < options.length && !options[from].disabled) {
      return from;
    }
    return firstEnabled;
  }

  const dir = delta > 0 ? 1 : -1;
  let remaining = Math.abs(delta);
  let current = from;

  // If starting from invalid index, clamp to entry edge
  if (current < 0) {
    if (dir > 0) {
      current = -1;
    } else {
      current = options.length;
    }
  } else if (current >= options.length) {
    current = options.length;
  }

  let lastValid = from >= 0 && from < options.length && !options[from].disabled ? from : -1;

  while (remaining > 0) {
    const next = current + dir;
    if (next < 0 || next >= options.length) {
      break;
    }
    current = next;
    if (!options[current].disabled) {
      lastValid = current;
      remaining--;
    }
  }

  if (lastValid !== -1) {
    return lastValid;
  }

  // If no valid step was possible, return nearest enabled or firstEnabled
  return dir > 0 ? (endIndex(options) !== -1 ? endIndex(options) : firstEnabled) : firstEnabled;
}

/**
 * Jumps 10 enabled options in the given direction.
 */
export function pageIndex<T extends SelectOptionLike>(
  options: T[],
  from: number,
  direction: number | "up" | "down"
): number {
  const isDown = typeof direction === "number" ? direction > 0 : direction === "down";
  const delta = isDown ? 10 : -10;
  return moveIndex(options, from, delta);
}

/**
 * Case-insensitive prefix match on option labels starting after the current index and wrapping.
 * The same letter typed repeatedly cycles through options starting with it.
 * Skips disabled options. Returns -1 if no match.
 */
export function typeahead<T extends SelectOptionLike>(
  options: T[],
  from: number,
  buffer: string
): number {
  if (!options || options.length === 0 || !buffer.trim()) {
    return -1;
  }

  const query = buffer.toLowerCase();
  const isRepeatedChar = query.length > 1 && query.split("").every((c) => c === query[0]);
  const searchPrefix = isRepeatedChar ? query[0] : query;

  // If multi-char query (not repeated single char) and current option matches, stay on it
  if (query.length > 1 && !isRepeatedChar && from >= 0 && from < options.length) {
    const cur = options[from];
    if (!cur.disabled && cur.label.toLowerCase().startsWith(query)) {
      return from;
    }
  }

  const len = options.length;
  const start = from >= 0 ? from : -1;

  for (let i = 1; i <= len; i++) {
    const idx = (start + i + len) % len;
    const opt = options[idx];
    if (!opt.disabled && opt.label.toLowerCase().startsWith(searchPrefix)) {
      return idx;
    }
  }

  return -1;
}

/**
 * Determines popover placement (bottom vs top) and max-height.
 * Bottom by default; flips to top only when room below < min(listHeight, maxHeight) AND room above > room below.
 * maxHeight is limited by room on chosen side minus margin.
 */
export function placement({
  triggerRect,
  viewportHeight,
  listHeight,
  gap = 6,
  margin = 12,
  maxHeight = 280,
}: PlacementOptions): PlacementResult {
  const roomBelow = Math.max(0, viewportHeight - triggerRect.bottom - gap);
  const roomAbove = Math.max(0, triggerRect.top - gap);
  const neededHeight = Math.min(listHeight, maxHeight);

  // Top only when room below is smaller than min(listHeight, maxHeight) AND room above is larger
  const shouldFlipToTop = roomBelow < neededHeight && roomAbove > roomBelow;
  const side: "bottom" | "top" = shouldFlipToTop ? "top" : "bottom";

  const chosenRoom = side === "top" ? roomAbove : roomBelow;
  const availableMaxHeight = Math.max(0, Math.min(maxHeight, chosenRoom - margin));

  return {
    side,
    maxHeight: availableMaxHeight,
  };
}
