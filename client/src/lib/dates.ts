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

/**
 * The last day an event runs, as YYYY-MM-DD, derived from the source date text.
 * - single date `2026-06-12`        -> `2026-06-12`
 * - date range  `2026-06-15 to ...` -> the end date
 * - month range `2026-06 to 2026-08`-> last day of the end month (`2026-08-31`)
 * Returns null when the value can't be parsed.
 */
export function eventEndDate(eventDate: string): string | null {
  const parts = eventDate.split(/\s+to\s+/i);
  const endToken = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim();

  const full = endToken.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (full) {
    const [, y, m, d] = full;
    return `${y}-${m}-${d}`;
  }

  const month = endToken.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const y = Number(month[1]);
    const m = Number(month[2]);
    if (m >= 1 && m <= 12) {
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      return `${month[1]}-${month[2]}-${String(lastDay).padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * An event is upcoming if it hasn't finished yet (end date today or later).
 * Events with an unparseable date are kept — we can't prove they're past.
 */
export function isUpcoming(eventDate: string, today: string = todayIso()): boolean {
  const end = eventEndDate(eventDate);
  if (end === null) return true;
  return end >= today;
}
