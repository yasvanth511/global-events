import type { FilterCriteria, SortOption } from "../lib/filtering";
import { monthLabel } from "../lib/dates";

type Options = {
  cities: string[];
  states: string[];
  countries: string[];
  orgs: string[];
  months: string[];
};

type Props = {
  criteria: FilterCriteria;
  options: Options;
  resultCount: number;
  totalCount: number;
  onChange: (patch: Partial<FilterCriteria>) => void;
  onClear: () => void;
};

const selectClass =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const inputClass = selectClass;
const labelClass = "block text-xs font-medium text-slate-600";

function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select id={id} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Filters({ criteria, options, resultCount, totalCount, onChange, onClear }: Props) {
  return (
    <section aria-label="Search and filters" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <label htmlFor="search" className={labelClass}>
          Search
        </label>
        <input
          id="search"
          type="search"
          className={inputClass}
          placeholder="Search name, organization, location, contact…"
          value={criteria.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <SelectFilter id="city" label="City" value={criteria.city} options={options.cities} onChange={(v) => onChange({ city: v })} />
        <SelectFilter id="state" label="State" value={criteria.state} options={options.states} onChange={(v) => onChange({ state: v })} />
        <SelectFilter
          id="country"
          label="Country"
          value={criteria.country}
          options={options.countries}
          onChange={(v) => onChange({ country: v })}
        />
        <SelectFilter id="org" label="Organization/School" value={criteria.org} options={options.orgs} onChange={(v) => onChange({ org: v })} />

        <div>
          <label htmlFor="month" className={labelClass}>
            Month
          </label>
          <select
            id="month"
            className={selectClass}
            value={criteria.month}
            onChange={(e) => onChange({ month: e.target.value })}
          >
            <option value="">All</option>
            {options.months.map((month) => (
              <option key={month} value={month}>
                {monthLabel(month)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className={labelClass}>
            Sort by
          </label>
          <select
            id="sort"
            className={selectClass}
            value={criteria.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortOption })}
          >
            <option value="date-asc">Date (earliest)</option>
            <option value="date-desc">Date (latest)</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600" aria-live="polite">
          Showing <span className="font-semibold text-slate-900">{resultCount}</span> of {totalCount} events
        </p>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Clear all
        </button>
      </div>
    </section>
  );
}
