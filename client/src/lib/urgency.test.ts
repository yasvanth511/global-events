import { describe, it, expect } from "vitest";
import { daysUntil, getUrgency } from "./urgency";

const today = "2026-06-15";

describe("daysUntil", () => {
  it("computes whole-day differences from today", () => {
    expect(daysUntil("2026-06-15", today)).toBe(0);
    expect(daysUntil("2026-06-22", today)).toBe(7);
    expect(daysUntil("2026-06-12", today)).toBe(-3);
    expect(daysUntil(null, today)).toBeNull();
  });
});

describe("getUrgency", () => {
  const level = (start: string) => getUrgency(start, today).level;

  it("buckets events by proximity (monotonic red → green)", () => {
    expect(level("2026-06-10")).toBe("imminent"); // already started / ongoing
    expect(level("2026-06-15")).toBe("imminent"); // today
    expect(level("2026-06-22")).toBe("imminent"); // +7
    expect(level("2026-06-23")).toBe("near"); // +8
    expect(level("2026-06-29")).toBe("near"); // +14
    expect(level("2026-06-30")).toBe("approaching"); // +15
    expect(level("2026-07-06")).toBe("approaching"); // +21
    expect(level("2026-07-07")).toBe("upcoming"); // +22
    expect(level("2026-07-15")).toBe("upcoming"); // +30
    expect(level("2026-07-16")).toBe("distant"); // +31
  });

  it("produces relative-time labels", () => {
    expect(getUrgency("2026-06-15", today).label).toBe("Today");
    expect(getUrgency("2026-06-16", today).label).toBe("Tomorrow");
    expect(getUrgency("2026-06-20", today).label).toBe("In 5 days");
    expect(getUrgency("2026-06-10", today).label).toBe("Happening now");
  });

  it("is unknown for an unparseable start date", () => {
    expect(getUrgency(null, today)).toEqual({ level: "unknown", days: null, label: "" });
  });
});
