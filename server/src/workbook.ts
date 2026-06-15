import * as XLSX from "xlsx";
import type { EventRecord, ParseResult } from "./types.js";

/** The fixed 12-column contract, in the required order. */
export const REQUIRED_HEADERS = [
  "Event Date",
  "Event Time",
  "Event Org/School",
  "Event Name",
  "Event URL",
  "Contact Person",
  "Contact Phone",
  "Contact Email",
  "Address",
  "City",
  "State",
  "Country",
] as const;

const MAX_SAMPLE_ROWS = 5;

/**
 * Convert a raw cell to a usable string or null.
 * Blank cells, null/undefined, and case-insensitive "missing" all become null.
 */
export function normalizeCell(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === "") return null;
  if (text.toLowerCase() === "missing") return null;
  return text;
}

/**
 * Derive a sortable/filterable start date (YYYY-MM-DD) from the source date text.
 * Handles single dates, date ranges, and month ranges by taking the first token.
 * Month-only values are anchored to the first day of the month.
 * Returns null for unparseable values so they sort after valid dates.
 */
export function parseStartDate(eventDate: string | null): string | null {
  if (!eventDate) return null;
  const first = eventDate.split(/\s+to\s+/i)[0]?.trim() ?? "";

  const full = first.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (full) {
    const [, y, m, d] = full;
    if (isValidYmd(+y, +m, +d)) return `${y}-${m}-${d}`;
  }

  const month = first.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const [, y, m] = month;
    if (+m >= 1 && +m <= 12) return `${y}-${m}-01`;
  }

  return null;
}

function isValidYmd(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Small deterministic hash so card IDs are stable for the same workbook content. */
function stableId(index: number, eventName: string, eventDate: string): string {
  const seed = `${index}|${eventDate}|${eventName}`;
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return `evt-${(hash >>> 0).toString(36)}`;
}

/**
 * Parse and validate an uploaded workbook buffer against the fixed contract.
 * Reads cell values only (no formulas, no HTML). Never throws on bad data;
 * problems are returned as `errors` with `ok: false`.
 */
export function parseWorkbook(buffer: Buffer): ParseResult {
  const empty: ParseResult = {
    ok: false,
    headers: [],
    errors: [],
    events: [],
    sampleRows: [],
  };

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      cellFormula: false,
      cellHTML: false,
      cellDates: false,
    });
  } catch {
    return { ...empty, errors: ["The file could not be read as an .xlsx workbook."] };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ...empty, errors: ["The workbook contains no worksheets."] };
  }

  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: false,
  });

  if (grid.length === 0) {
    return { ...empty, errors: ["The first worksheet is empty."] };
  }

  // Detected headers: trim trailing empty columns, then trim each label.
  const rawHeaderRow = grid[0] ?? [];
  let lastIndex = rawHeaderRow.length - 1;
  while (lastIndex >= 0 && normalizeCell(rawHeaderRow[lastIndex]) === null) {
    lastIndex--;
  }
  const headers = rawHeaderRow
    .slice(0, lastIndex + 1)
    .map((cell) => (cell === null || cell === undefined ? "" : String(cell).trim()));

  const headerErrors = validateHeaders(headers);
  if (headerErrors.length > 0) {
    return { ...empty, headers, errors: headerErrors };
  }

  const dataRows = grid.slice(1).filter((row) => row.some((cell) => normalizeCell(cell) !== null));
  if (dataRows.length === 0) {
    return { ...empty, headers, errors: ["The workbook has no event rows."] };
  }

  const errors: string[] = [];
  const events: EventRecord[] = [];
  const sampleRows: (string | null)[][] = [];

  dataRows.forEach((row, index) => {
    const cells = REQUIRED_HEADERS.map((_, col) => normalizeCell(row[col]));
    if (index < MAX_SAMPLE_ROWS) sampleRows.push(cells);

    const rowNumber = index + 2; // +1 for header row, +1 for 1-based display
    const eventDate = cells[0];
    const eventName = cells[3];

    if (!eventName && !eventDate) {
      errors.push(`Row ${rowNumber}: Event Date and Event Name are required.`);
      return;
    }
    if (!eventDate) {
      errors.push(`Row ${rowNumber}: Event Date is required.`);
      return;
    }
    if (!eventName) {
      errors.push(`Row ${rowNumber}: Event Name is required.`);
      return;
    }

    events.push({
      id: stableId(index, eventName, eventDate),
      eventDate,
      eventTime: cells[1],
      eventOrgSchool: cells[2],
      eventName,
      eventUrl: cells[4],
      contactPerson: cells[5],
      contactPhone: cells[6],
      contactEmail: cells[7],
      address: cells[8],
      city: cells[9],
      state: cells[10],
      country: cells[11],
      startDate: parseStartDate(eventDate),
    });
  });

  const ok = errors.length === 0 && events.length > 0;
  return { ok, headers, errors, events, sampleRows };
}

function validateHeaders(headers: string[]): string[] {
  const errors: string[] = [];

  if (headers.length !== REQUIRED_HEADERS.length) {
    errors.push(
      `Expected exactly ${REQUIRED_HEADERS.length} columns but found ${headers.length}.`,
    );
  }

  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const header of headers) {
    if (seen.has(header)) duplicates.add(header);
    seen.add(header);
  }
  if (duplicates.size > 0) {
    errors.push(`Duplicate header(s): ${[...duplicates].join(", ")}.`);
  }

  const mismatches: string[] = [];
  for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
    if (headers[i] !== REQUIRED_HEADERS[i]) {
      mismatches.push(
        `column ${i + 1} should be "${REQUIRED_HEADERS[i]}" but was "${headers[i] ?? ""}"`,
      );
    }
  }
  if (mismatches.length > 0) {
    errors.push(`Headers must match the reference contract exactly: ${mismatches.join("; ")}.`);
  }

  return errors;
}
