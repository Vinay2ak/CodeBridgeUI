export function getInitials(raw: string): string {
  const parts = raw
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const first = parts[0]?.[0] ?? "";
  if (parts.length === 1) {
    return first.toUpperCase() || "?";
  }
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function lookupLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | undefined
): string | null {
  if (!value) {
    return null;
  }
  const match = options.find((opt) => opt.value === value);
  return match ? match.label : value;
}

export function NotSet({ label = "Not set yet" }: { label?: string }) {
  return (
    <span className="inline-block min-h-[1.25rem] text-xs italic text-text-muted/80">
      {label}
    </span>
  );
}
