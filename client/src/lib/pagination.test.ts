import { describe, it, expect } from "vitest";
import { clampPage, getPageCount, getPageRange, getPageSlice } from "./pagination";

const items = Array.from({ length: 74 }, (_, i) => i + 1);

describe("getPageCount", () => {
  it("ceils total/pageSize and is always at least 1", () => {
    expect(getPageCount(74, 12)).toBe(7);
    expect(getPageCount(24, 12)).toBe(2);
    expect(getPageCount(0, 12)).toBe(1);
  });

  it('treats "all" as a single page', () => {
    expect(getPageCount(74, "all")).toBe(1);
  });
});

describe("clampPage", () => {
  it("keeps the page within 1..pageCount", () => {
    expect(clampPage(0, 7)).toBe(1);
    expect(clampPage(99, 7)).toBe(7);
    expect(clampPage(3, 7)).toBe(3);
  });
});

describe("getPageSlice", () => {
  it("returns the correct window for a page", () => {
    expect(getPageSlice(items, 1, 12)).toEqual(items.slice(0, 12));
    expect(getPageSlice(items, 2, 12)).toEqual(items.slice(12, 24));
  });

  it("returns a short final page", () => {
    const last = getPageSlice(items, 7, 12);
    expect(last).toEqual([73, 74]);
    expect(last).toHaveLength(2);
  });

  it("clamps out-of-range pages instead of returning empty", () => {
    expect(getPageSlice(items, 99, 12)).toEqual([73, 74]);
  });

  it('returns everything for "all"', () => {
    expect(getPageSlice(items, 1, "all")).toHaveLength(74);
  });
});

describe("getPageRange", () => {
  it("reports the inclusive 1-based range shown", () => {
    expect(getPageRange(74, 1, 12)).toEqual({ start: 1, end: 12 });
    expect(getPageRange(74, 7, 12)).toEqual({ start: 73, end: 74 });
    expect(getPageRange(74, 1, "all")).toEqual({ start: 1, end: 74 });
    expect(getPageRange(0, 1, 12)).toEqual({ start: 0, end: 0 });
  });
});
