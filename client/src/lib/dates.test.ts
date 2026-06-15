import { describe, it, expect } from "vitest";
import { eventEndDate, isUpcoming, monthLabel, todayIso } from "./dates";

describe("eventEndDate", () => {
  it("returns the date itself for a single date", () => {
    expect(eventEndDate("2026-06-12")).toBe("2026-06-12");
  });

  it("returns the end of a date range", () => {
    expect(eventEndDate("2026-06-15 to 2026-06-18")).toBe("2026-06-18");
  });

  it("returns the last day of the end month for a month range", () => {
    expect(eventEndDate("2026-06 to 2026-08")).toBe("2026-08-31");
    expect(eventEndDate("2026-01 to 2026-02")).toBe("2026-02-28");
  });

  it("returns null for unparseable values", () => {
    expect(eventEndDate("TBD")).toBeNull();
  });
});

describe("isUpcoming", () => {
  const today = "2026-06-15";

  it("hides events that already finished", () => {
    expect(isUpcoming("2026-06-12", today)).toBe(false);
    expect(isUpcoming("2026-05-01 to 2026-06-10", today)).toBe(false);
  });

  it("keeps events happening today", () => {
    expect(isUpcoming("2026-06-15", today)).toBe(true);
  });

  it("keeps future events", () => {
    expect(isUpcoming("2026-06-30", today)).toBe(true);
  });

  it("keeps ongoing ranges that started before today but end later", () => {
    expect(isUpcoming("2026-06-01 to 2026-08-29", today)).toBe(true);
    expect(isUpcoming("2026-06 to 2026-08", today)).toBe(true);
  });

  it("keeps events with an unparseable date (cannot prove past)", () => {
    expect(isUpcoming("date unknown", today)).toBe(true);
  });
});

describe("todayIso", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayIso(new Date(2026, 5, 9))).toBe("2026-06-09");
  });
});

describe("monthLabel", () => {
  it("formats YYYY-MM as a readable month and year", () => {
    expect(monthLabel("2026-06")).toBe("June 2026");
    expect(monthLabel("2026-12")).toBe("December 2026");
  });

  it("returns the input unchanged when it is not YYYY-MM", () => {
    expect(monthLabel("nope")).toBe("nope");
  });
});
