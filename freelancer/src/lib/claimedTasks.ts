const STORAGE_KEY = "cb_claimed_tasks";

export function getClaimedTaskIds(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function claimTaskId(id: string): string[] {
  if (typeof localStorage === "undefined") return [id];
  try {
    const current = getClaimedTaskIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
    return current;
  } catch {
    return [id];
  }
}

export function hasClaimedTask(id: string): boolean {
  return getClaimedTaskIds().includes(id);
}

export function clearClaimedTasks(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
