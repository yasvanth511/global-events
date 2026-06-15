# Global Events - MVP Implementation Plan

## Objective

Build a small TypeScript web application that uses
[`technical_events_normalized.xlsx`](./technical_events_normalized.xlsx) as its
reference data contract.

The application has exactly two routes:

1. `/upload` for validating, previewing, and replacing the active workbook.
2. `/` for browsing event cards with search, filters, and sorting.

The MVP uses React, Vite, Express, SheetJS, and local file storage. It does not
use a database.

## Workbook Contract

Read the first worksheet and require these exact headers:

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

Validation rules:

- Accept `.xlsx` files only.
- Require exactly these 12 headers in the reference order, with no extras or
  duplicates.
- Ignore extra worksheets.
- Reject a workbook with no data rows.
- Reject rows where `Event Name` or `Event Date` is blank or `missing`.
- Treat blank cells, null values, and case-insensitive `missing` as unavailable.
- Read cell values only. Do not render spreadsheet HTML or execute formulas.
- Limit file size to a sensible MVP value such as 10 MB.

Date handling:

- Preserve the original date text for display.
- Support single dates, date ranges, and month ranges from the reference file.
- Parse the first date or month in the value as the sortable/filterable start.
- Keep an unparseable non-empty value for display, but place it after valid
  dates when sorting.

## Normalized Event Type

Use one shared event shape:

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

Convert `missing` and blank optional fields to `null` when parsing. Generate a
stable ID from the row index and core event values; the workbook does not
provide an ID column.

## Phase 1: Project Foundation

### Tasks

- Create root, `client`, and `server` TypeScript packages.
- Scaffold React with Vite.
- Add React Router and Tailwind CSS.
- Add a small Express server.
- Proxy `/api` from Vite to Express.
- Add root scripts for development, tests, type checking, and builds.
- Use one root command to start client and server.

### Acceptance Criteria

- `npm install` completes successfully.
- `npm run dev` starts both applications.
- `/` and `/upload` render without console errors.
- `GET /api/status` returns a healthy response.

## Phase 2: Workbook Parsing and Storage

### Tasks

- Create a parser using SheetJS.
- Validate the exact header names and order.
- Normalize rows into `EventRecord`.
- Convert unavailable values to `null`.
- Parse the start date used for sorting and filtering.
- Add useful validation messages with row numbers where possible.
- Use `data/active.xlsx` as the active workbook.
- When no active file exists, use
  `technical_events_normalized.xlsx` as the initial dataset or copy it to
  `data/active.xlsx` at startup.
- Replace the active file only after the uploaded workbook passes validation.

### Acceptance Criteria

- The reference workbook produces 74 valid events.
- Invalid headers are reported clearly.
- Empty and malformed workbooks are rejected.
- Failed uploads leave the current active workbook unchanged.
- Active data remains available after a server restart.

## Phase 3: Minimal API

### Endpoints

```text
GET  /api/status
GET  /api/events
POST /api/upload
```

### Behavior

`GET /api/status`

- Return whether an active dataset exists.
- Include file name, row count, and last-updated time when available.

`GET /api/events`

- Return all normalized events and basic active-file metadata.
- Do not implement server-side filters or pagination.

`POST /api/upload`

- Accept one `.xlsx` file.
- Validate and parse it before replacement.
- Return a preview and validation result before activation, or use a simple
  `confirm=true` field for the final replacement request.
- Keep preview and activation logic on the same `/upload` screen.

Choose the smallest clear request flow. Do not create a generalized publishing
system.

### Acceptance Criteria

- API responses use consistent JSON shapes.
- Upload errors are safe and understandable.
- Uploaded original filenames are never used as arbitrary filesystem paths.
- The browser never reads the server filesystem directly.

## Phase 4: Upload Page

### Tasks

- Add a file picker and drag-and-drop area.
- Show accepted format and size guidance.
- Show file name, row count, exact headers, and the first five rows.
- Show blocking validation errors clearly.
- Ask for confirmation before replacing existing data.
- Show upload progress or a clear busy state.
- Redirect to `/` after activation.
- Include a link back to the event catalog.

### Acceptance Criteria

- A valid workbook can be previewed and activated without leaving `/upload`.
- An invalid workbook cannot replace active data.
- Re-uploading requires an explicit confirmation.
- Keyboard users can operate the complete upload flow.

## Phase 5: Events Home Page

### Event Cards

Show available values in this order:

- Event name
- Date and time
- Organization or school
- Address, city, state, and country
- Event URL
- Contact person, phone, and email

Requirements:

- Never show the literal word `missing`.
- Do not render empty labels or separators.
- Use normal links for event URLs.
- Use `mailto:` for valid email addresses.
- Use `tel:` for phone values where practical.
- Open external event URLs safely.

### Search and Filters

- Keyword search across name, organization, address, city, state, country,
  contact person, phone, and email.
- City filter.
- State filter.
- Country filter.
- Organization/school filter.
- Date-from and date-to filters based on parsed `startDate`.
- Sort by date ascending, date descending, name ascending, or name descending.
- Visible result count.
- Clear-all action.

Exclude null values from filter option lists. Filters should combine using
logical AND. Search should be case-insensitive.

### States

- Loading state while events are fetched.
- Error state with a retry action.
- No-active-file state linking to `/upload`.
- No-results state with a clear-filters action.

### Acceptance Criteria

- All 74 reference events can render without errors.
- Filters and search work together.
- Missing data does not create broken cards or filter options.
- The layout works on small and large screens.
- Pagination is not present.

## Phase 6: Focused Verification

### Tests

- Parser accepts the reference headers.
- Parser converts `missing` and blanks to `null`.
- Parser handles single dates, date ranges, and month ranges.
- Parser rejects missing or duplicate required headers.
- Upload replacement does not occur after validation failure.
- Search and combined filters return expected events.
- Cards hide unavailable fields and create safe links.

### Final Checks

```bash
npm test
npm run typecheck
npm run build
```

Also verify manually:

1. Load the reference workbook.
2. Browse the event cards.
3. Combine search, location, organization, and date filters.
4. Upload the same workbook from `/upload`.
5. Confirm that the data still loads after restarting the server.
6. Check the two routes on mobile and desktop widths.

## Explicitly Out of Scope

- Authentication
- Database storage
- Multiple datasets
- Schema inference or mapping
- Configurable columns or card layouts
- Event creation or editing
- Separate event detail pages
- Category or description features not present in the workbook
- Server-side filtering
- Pagination
- URL-synchronized filters
- Cloud storage
- Backup history
- Docker and deployment automation
- Speculative storage adapters or plugin systems

## Definition of Done

The MVP is complete when:

- The application has only `/` and `/upload` as user-facing screens.
- The reference workbook loads as 74 events.
- A valid replacement workbook can be previewed and activated.
- Invalid uploads do not replace active data.
- Event cards display all available reference fields cleanly.
- Search, location, organization, date filters, and sorting work together.
- Literal `missing` values never appear as useful content.
- Active data persists across a normal server restart.
- Tests, type checking, and production builds pass.
