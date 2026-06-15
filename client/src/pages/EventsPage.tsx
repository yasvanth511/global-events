import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { EventRecord } from "../types";
import { fetchEvents } from "../lib/api";
import { applyFilters, distinctValues, EMPTY_CRITERIA, type FilterCriteria } from "../lib/filtering";
import EventCard from "../components/EventCard";
import Filters from "../components/Filters";

type LoadState = "loading" | "error" | "ready";

export default function EventsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [criteria, setCriteria] = useState<FilterCriteria>(EMPTY_CRITERIA);

  async function load() {
    setState("loading");
    try {
      const data = await fetchEvents();
      setEvents(data.events);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const options = useMemo(
    () => ({
      cities: distinctValues(events, "city"),
      states: distinctValues(events, "state"),
      countries: distinctValues(events, "country"),
      orgs: distinctValues(events, "eventOrgSchool"),
    }),
    [events],
  );

  const filtered = useMemo(() => applyFilters(events, criteria), [events, criteria]);

  function patch(update: Partial<FilterCriteria>) {
    setCriteria((prev) => ({ ...prev, ...update }));
  }

  if (state === "loading") {
    return <p className="py-16 text-center text-slate-500">Loading events…</p>;
  }

  if (state === "error") {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-slate-700">Something went wrong while loading events.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
        <h1 className="text-lg font-semibold text-slate-900">No active dataset</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          There are no events to show yet. Upload a normalized event workbook to build the catalog.
        </p>
        <Link
          to="/upload"
          className="mt-5 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Upload a workbook
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Filters
        criteria={criteria}
        options={options}
        resultCount={filtered.length}
        totalCount={events.length}
        onChange={patch}
        onClear={() => setCriteria(EMPTY_CRITERIA)}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-slate-700">No events match the current filters.</p>
          <button
            type="button"
            onClick={() => setCriteria(EMPTY_CRITERIA)}
            className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
