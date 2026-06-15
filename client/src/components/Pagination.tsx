import { PAGE_SIZE_OPTIONS, getPageRange, type PageSize } from "../lib/pagination";

type Props = {
  page: number;
  pageCount: number;
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
};

const navButtonClass =
  "rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export default function Pagination({ page, pageCount, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const { start, end } = getPageRange(total, page, pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row"
    >
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <label htmlFor="page-size" className="text-xs font-medium text-slate-600">
          Per page
        </label>
        <select
          id="page-size"
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          value={String(pageSize)}
          onChange={(e) => onPageSizeChange(e.target.value === "all" ? "all" : Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
          <option value="all">All</option>
        </select>
      </div>

      <p className="text-sm text-slate-600" aria-live="polite">
        Showing <span className="font-semibold text-slate-900">{start}</span>–
        <span className="font-semibold text-slate-900">{end}</span> of {total}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={navButtonClass}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ← Prev
        </button>
        <span className="text-sm text-slate-600" aria-current="page">
          Page <span className="font-semibold text-slate-900">{page}</span> of {pageCount}
        </span>
        <button
          type="button"
          className={navButtonClass}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
