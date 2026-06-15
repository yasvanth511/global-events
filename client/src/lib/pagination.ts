export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

/** A numeric page size, or "all" to show every result on one page. */
export type PageSize = number | "all";

export const DEFAULT_PAGE_SIZE: PageSize = 12;

/** Total number of pages for a result set (always at least 1). */
export function getPageCount(total: number, pageSize: PageSize): number {
  if (pageSize === "all" || total === 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Clamp a requested page into the valid 1..pageCount range. */
export function clampPage(page: number, pageCount: number): number {
  if (Number.isNaN(page)) return 1;
  return Math.min(Math.max(1, Math.trunc(page)), Math.max(1, pageCount));
}

/** The slice of items shown on the given (1-based) page. */
export function getPageSlice<T>(items: T[], page: number, pageSize: PageSize): T[] {
  if (pageSize === "all") return items;
  const safePage = clampPage(page, getPageCount(items.length, pageSize));
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** The 1-based inclusive range of items shown on the current page, e.g. "13–24 of 74". */
export function getPageRange(
  total: number,
  page: number,
  pageSize: PageSize,
): { start: number; end: number } {
  if (total === 0) return { start: 0, end: 0 };
  if (pageSize === "all") return { start: 1, end: total };
  const safePage = clampPage(page, getPageCount(total, pageSize));
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  return { start, end };
}
