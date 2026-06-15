# Claude Implementation Prompt

Implement the Global Events MVP in:

`C:\Apps\Utility Apps\GlobalEvents`

Do not return only a plan. Read the project files, build the application, run
it, test it, and fix issues before finishing.

## Read First

Read:

1. `readme.md`
2. `vision.md`
3. `plan.md`
4. `technical_events_normalized.xlsx`

Inspect the workbook itself before writing parser or UI code. It is the
reference data contract.

## Product Scope

This is a small local utility and MVP. Keep it straightforward.

There must be exactly two user-facing screens:

1. `/upload`
2. `/`

Do not add login, settings, configuration, onboarding, dashboard, or separate
event-detail screens.

## Reference Workbook

The reference file is:

`technical_events_normalized.xlsx`

It has one sheet named `Normalized Events`, 74 event rows, and these exact
headers:

```text
Event Date
Event Time
Event Org/School
Event Name
Event URL
Contact Person
Contact Phone
Contact Email
Address
City
State
Country
```

The workbook uses literal `missing` values when source data was unavailable.
Convert case-insensitive `missing`, blank cells, and null values to `null`.
Never display `missing` as useful content or include it in filter options.

`Event Date` may contain:

- `2026-06-12`
- `2026-06-15 to 2026-06-18`
- `2026-06 to 2026-08`

Preserve the source date text for display. Derive the first date or month as a
separate start value for filtering and sorting.

## Required Stack

Use:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Node.js with Express
- SheetJS/XLSX
- Zod for small validation schemas where useful
- Vitest and React Testing Library

Use a small `client` and `server` structure. Add root scripts so these commands
work:

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

`npm run dev` must start both the client and server.

## Data Model

Use one explicit normalized event type similar to:

```ts
type EventRecord = {
  id: string;
  eventDate: string;
  eventTime: string | null;
  eventOrgSchool: string | null;
  eventName: string;
  eventUrl: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  startDate: string | null;
};
```

The fixed 12-column schema is intentional. Do not build schema inference,
column mapping, configurable field roles, or a generic spreadsheet platform.

## Server Requirements

Implement only the API needed by the two screens:

```text
GET  /api/status
GET  /api/events
POST /api/upload
```

Use local storage:

```text
data/active.xlsx
```

On first run, use `technical_events_normalized.xlsx` as the active data or copy
it to `data/active.xlsx`.

Upload behavior:

- Accept one `.xlsx` file.
- Use a sensible size limit such as 10 MB.
- Read the first worksheet.
- Require exactly the 12 reference headers in the documented order, with no
  extras or duplicates.
- Reject an empty workbook.
- Reject rows where `Event Name` or `Event Date` is blank or `missing`.
- Parse and validate before replacing the active workbook.
- Do not trust the original filename as a filesystem path.
- Read cell values only and never render spreadsheet HTML.
- Keep the current active file unchanged when validation fails.

Keep preview and activation simple. One endpoint may support a preview request
and a confirmed replacement request. Do not create upload tokens, schema
versions, backup managers, storage adapters, or an activation framework.

## Screen 1: Upload

At `/upload`:

- Provide a file picker and drag-and-drop area.
- Explain that `.xlsx` and the exact reference headers are required.
- Validate the selected workbook through the server.
- Show the file name, event count, detected headers, and first five rows.
- Show clear blocking errors.
- Require confirmation before replacing the current dataset.
- Show a busy state while uploading.
- Redirect to `/` after success.
- Include a link back to the event catalog.

The whole upload flow stays on this one screen.

## Screen 2: Events Home

At `/`:

- Fetch all normalized events.
- Display them in a responsive card grid.
- Include a small `Upload new file` action in the header.
- Show an obvious upload action when no active dataset exists.

Each card should show available values in this order:

1. Event name
2. Date and time
3. Organization or school
4. Address, city, state, and country
5. Event URL
6. Contact person, phone, and email

Card rules:

- Omit unavailable fields and their labels.
- Do not show blank separators.
- Use safe external links for URLs.
- Use `mailto:` for emails.
- Use `tel:` for phone numbers where practical.
- Keep all details in the card; do not create a third route.

## Search, Filters, and Sorting

Filtering can happen entirely in the browser because the reference dataset has
only 74 rows.

Include:

- Case-insensitive keyword search across useful fields.
- City filter.
- State filter.
- Country filter.
- Organization/school filter.
- Date-from and date-to filters using the parsed start date.
- Sort options for date ascending/descending and name
  ascending/descending.
- Result count.
- Clear-all action.

Filters must work together. Exclude unavailable values from option lists. Do
not add pagination, category filters, or filters for fields that do not exist
in the workbook.

## UI Direction

- Build a polished but modest utility interface.
- Use a centered page, clear typography, compact controls, and readable cards.
- Make the filter area responsive without adding a sidebar or dashboard.
- Add loading, error, no-data, and no-results states.
- Use accessible labels, keyboard-friendly controls, visible focus styles, and
  adequate contrast.
- Avoid large animations and unnecessary dependencies.

## Testing

Add a few focused tests:

- Exact header validation.
- Conversion of `missing` values to `null`.
- Parsing of single dates and date ranges.
- Rejection of invalid uploads without replacing active data.
- Combined search and filters.
- Cards omit missing fields and render safe links.

Do not build a large test suite.

## Explicitly Out of Scope

Do not implement:

- authentication
- database storage
- multiple datasets
- schema mapping or inference
- configurable cards
- event editing
- separate event-detail routes
- category or description fields
- server-side search/filter APIs
- pagination
- URL-synchronized filter state
- cloud storage
- Docker
- deployment automation
- backup history
- speculative architecture for future features

## Completion Requirements

Before finishing:

1. Run the application.
2. Verify both routes.
3. Confirm that the reference workbook loads as 74 events.
4. Test combined search and filters.
5. Test upload preview and replacement.
6. Run tests, type checking, and production builds.
7. Fix any failures.
8. Update `readme.md` only if actual implementation commands or structure
   differ from the plan.

At the end, summarize what was built, important files, run commands, checks
that passed, and any genuine remaining limitation.
