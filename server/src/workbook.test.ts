import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { REQUIRED_HEADERS, normalizeCell, parseStartDate, parseWorkbook } from "./workbook.js";

/** Build an in-memory .xlsx buffer from an array-of-arrays grid. */
function makeWorkbook(rows: (string | null)[][], sheetName = "Normalized Events"): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const HEADER_ROW = [...REQUIRED_HEADERS];

function validRow(overrides: Partial<Record<number, string | null>> = {}): (string | null)[] {
  const base: (string | null)[] = [
    "2026-06-12",
    "2:00 PM",
    "Aquinas College",
    "Information Session",
    "https://example.com",
    "missing",
    "(616) 632-2900",
    "missing",
    "1700 Fulton St E",
    "Grand Rapids",
    "MI",
    "United States",
  ];
  for (const [k, v] of Object.entries(overrides)) base[Number(k)] = v ?? null;
  return base;
}

describe("normalizeCell", () => {
  it("converts missing, blanks, and null to null", () => {
    expect(normalizeCell("missing")).toBeNull();
    expect(normalizeCell("Missing")).toBeNull();
    expect(normalizeCell("  MISSING  ")).toBeNull();
    expect(normalizeCell("")).toBeNull();
    expect(normalizeCell("   ")).toBeNull();
    expect(normalizeCell(null)).toBeNull();
    expect(normalizeCell(undefined)).toBeNull();
  });

  it("keeps real values and trims them", () => {
    expect(normalizeCell("  Aquinas College ")).toBe("Aquinas College");
    expect(normalizeCell("missingno")).toBe("missingno");
  });
});

describe("parseStartDate", () => {
  it("parses a single date", () => {
    expect(parseStartDate("2026-06-12")).toBe("2026-06-12");
  });

  it("parses the first date of a date range", () => {
    expect(parseStartDate("2026-06-15 to 2026-06-18")).toBe("2026-06-15");
  });

  it("anchors a month range to the first of the month", () => {
    expect(parseStartDate("2026-06 to 2026-08")).toBe("2026-06-01");
  });

  it("returns null for unparseable or empty values", () => {
    expect(parseStartDate("TBD")).toBeNull();
    expect(parseStartDate("")).toBeNull();
    expect(parseStartDate(null)).toBeNull();
    expect(parseStartDate("2026-13-40")).toBeNull();
  });
});

describe("parseWorkbook", () => {
  it("accepts the reference headers and normalizes rows", () => {
    const buffer = makeWorkbook([HEADER_ROW, validRow()]);
    const result = parseWorkbook(buffer);
    expect(result.ok).toBe(true);
    expect(result.headers).toEqual([...REQUIRED_HEADERS]);
    expect(result.events).toHaveLength(1);

    const event = result.events[0];
    expect(event.eventName).toBe("Information Session");
    expect(event.startDate).toBe("2026-06-12");
    // "missing" cells became null.
    expect(event.contactPerson).toBeNull();
    expect(event.contactEmail).toBeNull();
    expect(event.eventUrl).toBe("https://example.com");
  });

  it("rejects missing required headers", () => {
    const badHeaders = HEADER_ROW.slice(0, 11); // drop "Country"
    const buffer = makeWorkbook([badHeaders, validRow().slice(0, 11)]);
    const result = parseWorkbook(buffer);
    expect(result.ok).toBe(false);
    expect(result.events).toHaveLength(0);
    expect(result.errors.join(" ")).toMatch(/exactly 12 columns/i);
  });

  it("rejects duplicate headers", () => {
    const dup = [...HEADER_ROW];
    dup[11] = "City"; // duplicate "City", drop "Country"
    const buffer = makeWorkbook([dup, validRow()]);
    const result = parseWorkbook(buffer);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/duplicate/i);
  });

  it("rejects out-of-order headers", () => {
    const swapped = [...HEADER_ROW];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    const buffer = makeWorkbook([swapped, validRow()]);
    const result = parseWorkbook(buffer);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/match the reference contract/i);
  });

  it("rejects an empty workbook", () => {
    const buffer = makeWorkbook([HEADER_ROW]);
    const result = parseWorkbook(buffer);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/no event rows/i);
  });

  it("rejects rows where Event Name or Event Date is blank or missing", () => {
    const buffer = makeWorkbook([
      HEADER_ROW,
      validRow(),
      validRow({ 3: "missing" }), // missing name
      validRow({ 0: "" }), // blank date
    ]);
    const result = parseWorkbook(buffer);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /Event Name is required/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /Event Date is required/i.test(e))).toBe(true);
  });
});
