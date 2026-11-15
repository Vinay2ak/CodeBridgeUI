const listeners = new Set<(taskId: string | null) => void>();

export function getTaskId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("task");
}

export function setTaskId(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("task", id);
  window.history.replaceState({}, "", url.toString());
  listeners.forEach((listener) => listener(id));
}

export function subscribeTaskId(listener: (taskId: string | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

