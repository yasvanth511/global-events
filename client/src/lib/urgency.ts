import { todayIso } from "./dates";

export type UrgencyLevel =
  | "imminent" // <= 7 days (or happening now)
  | "near" // 8–14 days
  | "approaching" // 15–21 days
  | "upcoming" // 22–30 days
  | "distant" // 30+ days
  | "unknown"; // no parseable start date

export type Urgency = {
  level: UrgencyLevel;
  /** Whole days from today to the event's start. Negative = already started (ongoing). Null = unknown. */
  days: number | null;
  /** Short human label for the badge, e.g. "Today", "In 5 days". Empty when unknown. */
  label: string;
};

/** Whole-day difference between today and a YYYY-MM-DD start date (UTC midnights). */
export function daysUntil(startDate: string | null, today: string = todayIso()): number | null {
  if (!startDate) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(now)) return null;
  return Math.round((start - now) / 86_400_000);
}

function relativeLabel(days: number): string {
  if (days < 0) return "Happening now";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/**
 * Classify an event by how soon it starts, for an at-a-glance urgency colour.
 * Ongoing events (start already passed but not yet hidden) count as most urgent.
 */
export function getUrgency(startDate: string | null, today: string = todayIso()): Urgency {
  const days = daysUntil(startDate, today);
  if (days === null) return { level: "unknown", days: null, label: "" };

  const label = relativeLabel(days);
  let level: UrgencyLevel;
  if (days <= 7) level = "imminent";
  else if (days <= 14) level = "near";
  else if (days <= 21) level = "approaching";
  else if (days <= 30) level = "upcoming";
  else level = "distant";

  return { level, days, label };
}

/**
 * Tailwind classes per urgency level. Full literal class names so the Tailwind
 * scanner keeps them. `card` tints the card + left accent; `badge` styles the pill.
 */
export const URGENCY_STYLES: Record<UrgencyLevel, { card: string; badge: string }> = {
  imminent: {
    card: "border-slate-200 border-l-4 border-l-red-500 bg-red-50",
    badge: "bg-red-100 text-red-800",
  },
  near: {
    card: "border-slate-200 border-l-4 border-l-orange-500 bg-orange-50",
    badge: "bg-orange-100 text-orange-800",
  },
  approaching: {
    card: "border-slate-200 border-l-4 border-l-amber-500 bg-amber-50",
    badge: "bg-amber-100 text-amber-900",
  },
  upcoming: {
    card: "border-slate-200 border-l-4 border-l-lime-500 bg-lime-50",
    badge: "bg-lime-100 text-lime-900",
  },
  distant: {
    card: "border-slate-200 border-l-4 border-l-emerald-500 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-800",
  },
  unknown: {
    card: "border-slate-200 bg-white",
    badge: "bg-slate-100 text-slate-700",
  },
};
