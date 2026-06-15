import { describe, it, expect } from "vitest";
import { applyFilters, distinctValues, EMPTY_CRITERIA, type FilterCriteria } from "./filtering";
import type { EventRecord } from "../types";

function makeEvent(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: Math.random().toString(36).slice(2),
    eventDate: "2026-06-12",
    eventTime: null,
    eventOrgSchool: null,
    eventName: "Event",
    eventUrl: null,
    contactPerson: null,
    contactPhone: null,
    contactEmail: null,
    address: null,
    city: null,
    state: null,
    country: null,
    startDate: "2026-06-12",
    ...overrides,
  };
}

const events: EventRecord[] = [
  makeEvent({
    eventName: "Music Session",
    eventOrgSchool: "Cleveland Institute of Music",
    city: "Cleveland",
    state: "OH",
    country: "United States",
    startDate: "2026-06-30",
    eventDate: "2026-06-30",
  }),
  makeEvent({
    eventName: "Campus Tour",
    eventOrgSchool: "Aquinas College",
    city: "Grand Rapids",
    state: "MI",
    country: "United States",
    startDate: "2026-06-12",
    eventDate: "2026-06-12",
  }),
  makeEvent({
    eventName: "Summer Camp",
    eventOrgSchool: "Aquinas College",
    city: "Grand Rapids",
    state: "MI",
    country: "United States",
    startDate: "2026-07-06",
    eventDate: "2026-07-06 to 2026-07-10",
  }),
];

function criteria(overrides: Partial<FilterCriteria>): FilterCriteria {
  return { ...EMPTY_CRITERIA, ...overrides };
}

describe("applyFilters", () => {
  it("keyword search is case-insensitive and spans fields", () => {
    expect(applyFilters(events, criteria({ search: "music" }))).toHaveLength(1);
    expect(applyFilters(events, criteria({ search: "AQUINAS" }))).toHaveLength(2);
  });

  it("combines filters with logical AND", () => {
    const result = applyFilters(events, criteria({ state: "MI", search: "summer" }));
    expect(result).toHaveLength(1);
    expect(result[0].eventName).toBe("Summer Camp");
  });

  it("filters by date range using the parsed start date", () => {
    const result = applyFilters(events, criteria({ dateFrom: "2026-06-15", dateTo: "2026-07-31" }));
    // Default sort is date ascending: Music Session (06-30) precedes Summer Camp (07-06).
    expect(result.map((e) => e.eventName)).toEqual(["Music Session", "Summer Camp"]);
  });

  it("sorts by date ascending and name", () => {
    const byDate = applyFilters(events, criteria({ sort: "date-asc" }));
    expect(byDate.map((e) => e.eventName)).toEqual(["Campus Tour", "Music Session", "Summer Camp"]);

    const byName = applyFilters(events, criteria({ sort: "name-asc" }));
    expect(byName.map((e) => e.eventName)).toEqual(["Campus Tour", "Music Session", "Summer Camp"]);
  });

  it("returns no results when filters exclude everything", () => {
    expect(applyFilters(events, criteria({ city: "Chicago" }))).toHaveLength(0);
  });
});

describe("distinctValues", () => {
  it("returns sorted, de-duplicated, non-null values", () => {
    expect(distinctValues(events, "city")).toEqual(["Cleveland", "Grand Rapids"]);
    expect(distinctValues(events, "state")).toEqual(["MI", "OH"]);
  });

  it("omits null values from options", () => {
    const withNulls = [...events, makeEvent({ city: null })];
    expect(distinctValues(withNulls, "city")).toEqual(["Cleveland", "Grand Rapids"]);
  });
});
