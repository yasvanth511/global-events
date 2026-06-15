# Global Events

Global Events is a small web utility that turns a normalized Excel workbook
into a searchable event-card catalog.

The MVP has exactly two screens:

1. `/upload` to upload and preview an event workbook.
2. `/` to browse, search, filter, and sort event cards.

The reference workbook is
[`technical_events_normalized.xlsx`](./technical_events_normalized.xlsx). It
contains 74 event rows on the `Normalized Events` sheet.

## Status

The MVP is implemented. The repository contains a React + Vite client and an
Express + SheetJS server, plus the reference workbook and implementation
documentation. See [Local Development](#local-development) to run it and
[`plan.md`](./plan.md) for the original implementation sequence.

## Reference Workbook Contract

Uploaded workbooks must use these exact headers in this order:

| Column | Purpose |
| --- | --- |
| `Event Date` | Single date, date range, or month range |
| `Event Time` | Start time or time range |
| `Event Org/School` | Hosting organization, school, or institution |
| `Event Name` | Primary event title |
| `Event URL` | Event or registration URL |
| `Contact Person` | Named contact or contact label |
| `Contact Phone` | One or more phone numbers |
| `Contact Email` | One or more email addresses |
| `Address` | Venue name, street address, or online location |
| `City` | Event city |
| `State` | State abbreviation |
| `Country` | Country name |

The first worksheet is used. Extra worksheets are ignored for the MVP.

Unavailable source data is represented by the literal text `missing`. The
application must treat `missing`, blank cells, and null values as unavailable
data. It should not display the word `missing` on event cards.

### Date Values

The reference workbook includes:

- Single dates such as `2026-06-12`
- Date ranges such as `2026-06-15 to 2026-06-18`
- Month ranges such as `2026-06 to 2026-08`

The app should display the original value and use the first valid date in the
cell for sorting and date filtering.

## MVP Features

### Upload

- Accept one `.xlsx` file.
- Validate the required headers.
- Reject empty files or files without usable event rows.
- Show the file name, row count, headers, validation errors, and a short row
  preview.
- Let the user confirm replacement of the current dataset.
- Save the active workbook locally and redirect to `/`.

### Event Catalog

- Display events in a responsive card grid.
- Show event name, date, time, organization, location, contact details, and URL
  when those values are available.
- Search across all useful event fields.
- Filter by city, state, country, month, and organizer type — Academic vs
  Professional, derived from the organizer text (other organizers show under All).
- Sort by event date or event name.
- Hide events that have already finished (judged by the event's end date, so
  ongoing multi-day/month ranges stay visible; unparseable dates are kept).
- Colour each card by how soon it starts (red ≤7 days → orange → amber → lime →
  green 30+ days) with a relative-time badge, for an at-a-glance sense of urgency.
- Show the result count and a clear-filters action.
- Paginate the filtered results (page size 12/24/48/All, prev/next, page indicator).
- Show useful empty, loading, and error states.

The supplied workbook is small, so filtering, sorting, and pagination all happen
in the browser over the filtered result set (no server-side paging).

## Proposed Stack

- React and TypeScript
- Vite
- React Router
- Tailwind CSS
- Node.js, Express, and TypeScript
- SheetJS/XLSX
- Zod
- Vitest and React Testing Library

No database is required.

## Minimal Architecture

```text
Browser
  |
  v
React application
  |
  v
Small Express API
  |-- validates uploads
  |-- parses the active workbook
  |-- returns normalized event JSON
  |
  v
Local data/active.xlsx
```

Suggested API:

```text
GET  /api/status
GET  /api/events
POST /api/upload
```

## Project Structure

```text
/
  client/                      # React + Vite + Tailwind SPA
    src/
      components/              # EventCard, Filters
      pages/                  # EventsPage (/), UploadPage (/upload)
      lib/                    # api.ts (fetch), filtering.ts (search/filter/sort)
      types.ts                # EventRecord and API response shapes
  server/                      # Express + SheetJS API (npm workspace)
    src/
      index.ts                # bootstrap: seed data, start server
      app.ts                  # Express app + routes (createApp)
      workbook.ts             # SheetJS parsing, header + row validation, date parsing
      storage.ts              # data/active.xlsx read/replace, seeding, metadata
      types.ts                # shared server types
  data/                        # created at runtime; holds active.xlsx (+ meta)
  technical_events_normalized.xlsx
  package.json                 # root workspace with dev/build/test/typecheck scripts
```

Header and row validation live in `workbook.ts` rather than a separate
`validation.ts`. The data folder is created on first run by copying the
reference workbook to `data/active.xlsx`.

## Local Development

```bash
npm install
npm run dev
```

`npm run dev` starts both the Express API (http://localhost:3001) and the Vite
client (http://localhost:5173, which proxies `/api` to the server). Open
http://localhost:5173.

Verification commands:

```bash
npm test        # Vitest unit/integration tests (client + server)
npm run typecheck
npm run build
```

## Run with Docker (local)

A multi-stage [`Dockerfile`](./Dockerfile) builds the client and server, then
serves both from a single Node process. The Express server hosts the built SPA
and the `/api` routes on one port, so no proxy or second container is needed.

```bash
docker compose up -d --build   # or: npm run docker:up
```

Then open http://localhost:3001.

```bash
docker compose down            # stop (keeps the data volume); npm run docker:down
```

The active workbook is stored in the named `global-events-data` volume mounted
at `/app/data`, so uploads persist across container restarts. On first run the
container seeds `data/active.xlsx` from the bundled reference workbook (74
events).

## Deploy to Vercel

The repo is Vercel-ready via [`vercel.json`](./vercel.json):

- The client is built to `client/dist` and served as a static SPA.
- The Express API runs as a single serverless function ([`api/index.mjs`](./api/index.mjs),
  which re-exports the built server). `/api/*` is rewritten to that function;
  all other paths fall back to `index.html` for client-side routing.

Deploy by importing the GitHub repo at https://vercel.com/new (no extra
settings needed), or with the CLI:

```bash
npm i -g vercel
vercel --prod
```

**Serverless data note:** Vercel function filesystems are read-only apart from a
temporary directory. The event catalog always works because it falls back to the
bundled reference workbook (74 events). Upload validation/preview also works, but
a confirmed replacement is written to a temp dir and is **not durable** across
cold starts — durable uploads need the local/Docker run above (or external
storage, which is out of scope for this MVP).

## Local Boundaries

This build does not include authentication, a database, schema mapping,
multiple datasets, event editing, a separate event-details page, cloud
storage, or deployment automation. (Local Docker packaging is provided above
for convenience; cloud deployment is still out of scope.)

## Related Documents

- [`vision.md`](./vision.md) defines the product goals and boundaries.
- [`plan.md`](./plan.md) defines the implementation sequence.
- [`CLAUDE_PROMPT.md`](./CLAUDE_PROMPT.md) is the implementation prompt.
