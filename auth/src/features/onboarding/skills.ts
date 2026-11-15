export function normalizeSkill(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 24);
}

export function addSkill(existing: string[], raw: string): string[] {
  const normalized = normalizeSkill(raw);
  if (normalized === "") return existing;
  if (existing.length >= 12) return existing;
  const lowerNorm = normalized.toLowerCase();
  if (existing.some((s) => s.toLowerCase() === lowerNorm)) return existing;
  return [...existing, normalized];
}
