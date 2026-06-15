const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Human label for a YYYY-MM value, e.g. "2026-06" -> "June 2026". */
export function monthLabel(ym: string): string {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return ym;
  const index = Number(m[2]) - 1;
  if (index < 0 || index > 11) return ym;
  return `${MONTH_NAMES[index]} ${m[1]}`;
}

/** Today's local date as YYYY-MM-DD (matches the YYYY-MM-DD startDate format). */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
