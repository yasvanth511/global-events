import { describe, it, expect } from "vitest";
import { monthLabel, todayIso } from "./dates";

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
