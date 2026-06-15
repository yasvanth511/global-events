import type { EventRecord } from "../types";
import { classifyOrg, type OrgType } from "./orgType";

export type SortOption = "date-asc" | "date-desc" | "name-asc" | "name-desc";

export type FilterCriteria = {
  search: string;
  city: string;
  state: string;
  country: string;
  orgType: "" | Exclude<OrgType, "other">; // "" = all, else academic/professional
  month: string; // YYYY-MM, or "" for all months
  sort: SortOption;
};

export const EMPTY_CRITERIA: FilterCriteria = {
  search: "",
  city: "",
  state: "",
  country: "",
  orgType: "",
  month: "",
  sort: "date-asc",
};

/** Fields included in the case-insensitive keyword search. */
function searchableText(event: EventRecord): string {
  return [
    event.eventName,
    event.eventOrgSchool,
    event.address,
    event.city,
    event.state,
    event.country,
    event.contactPerson,
    event.contactPhone,
    event.contactEmail,
    event.eventDate,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function matches(event: EventRecord, criteria: FilterCriteria): boolean {
  const search = criteria.search.trim().toLowerCase();
  if (search && !searchableText(event).includes(search)) return false;

  if (criteria.city && event.city !== criteria.city) return false;
  if (criteria.state && event.state !== criteria.state) return false;
  if (criteria.country && event.country !== criteria.country) return false;
  if (criteria.orgType && classifyOrg(event) !== criteria.orgType) return false;

  // Month filter uses the parsed start date's month; events without one are
  // excluded only when a month is selected.
  if (criteria.month) {
    if (!event.startDate || event.startDate.slice(0, 7) !== criteria.month) return false;
  }

  return true;
}

function compare(a: EventRecord, b: EventRecord, sort: SortOption): number {
  switch (sort) {
    case "name-asc":
      return a.eventName.localeCompare(b.eventName);
    case "name-desc":
      return b.eventName.localeCompare(a.eventName);
    case "date-asc":
    case "date-desc": {
      // Events without a parsed start date sort last in both directions.
      const aHas = a.startDate !== null;
      const bHas = b.startDate !== null;
      if (!aHas && !bHas) return a.eventName.localeCompare(b.eventName);
      if (!aHas) return 1;
      if (!bHas) return -1;
      const cmp = a.startDate!.localeCompare(b.startDate!);
      return sort === "date-asc" ? cmp : -cmp;
    }
    default:
      return 0;
  }
}

export function applyFilters(events: EventRecord[], criteria: FilterCriteria): EventRecord[] {
  return events.filter((event) => matches(event, criteria)).sort((a, b) => compare(a, b, criteria.sort));
}

/** Distinct, non-null, sorted values for a filter dropdown. */
export function distinctValues(events: EventRecord[], key: keyof EventRecord): string[] {
  const set = new Set<string>();
  for (const event of events) {
    const value = event[key];
    if (typeof value === "string" && value.trim() !== "") set.add(value);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Distinct YYYY-MM start months present in the events, chronologically sorted. */
export function distinctMonths(events: EventRecord[]): string[] {
  const set = new Set<string>();
  for (const event of events) {
    if (event.startDate) set.add(event.startDate.slice(0, 7));
  }
  return [...set].sort();
}
