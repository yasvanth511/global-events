# Global Events - Product Vision

## Vision

Create a small, practical web utility for browsing event information stored in
a normalized Excel workbook.

The product should make a spreadsheet easier to use without becoming a content
management system. A user uploads one workbook, then views its rows as clean,
searchable event cards.

## Reference Data

The product is based on
[`technical_events_normalized.xlsx`](./technical_events_normalized.xlsx).

The workbook has one `Normalized Events` sheet, 74 event rows, and these fixed
columns:

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

The workbook uses `missing` when a value is unavailable. The application
should understand that convention and omit unavailable details from the UI.

## Problem

The event data is already structured in Excel, but a wide spreadsheet is
awkward to scan, especially when users want to:

- Find events by name or organization.
- Narrow events by location.
- Review dates in chronological order.
- Open event links or contact an organizer.
- Browse the data comfortably on a phone.

Global Events provides that browsing layer while keeping Excel as the source
of truth.

## Target Users

- A maintainer who periodically replaces the event workbook.
- Visitors who want to discover events and view their details.
- Small teams that need a lightweight event directory without a database.

## Product Goals

1. Turn every valid workbook row into a readable event card.
2. Make events easy to search, filter, and sort.
3. Let a maintainer replace the active workbook in one short upload flow.
4. Handle `missing` values without broken layouts or noisy placeholders.
5. Work well on desktop and mobile.
6. Stay small enough to understand and maintain easily.

## Product Principles

### Fixed Input Contract

The normalized 12-column workbook is the application contract. The MVP does
not need schema inference, field mapping, or configurable card layouts.

### Two Screens Only

The entire user experience is:

1. An upload page at `/upload`.
2. An event catalog at `/`.

Event details belong inside the cards. There is no separate details page.

### Show Useful Data

`Event Name` is the card title. Date and time provide schedule context.
Organization and address provide venue context. Contact and URL fields should
appear only when available.

Literal `missing` values must never become links, phone actions, email actions,
filter options, or visible card content.

### Simple Upload

Uploading should validate the exact header set, show a short preview, and
require a clear confirmation before replacing the active data.

### Small Implementation

The dataset is modest, so the server can parse the workbook once and the client
can perform search, filtering, and sorting. The MVP does not need a database,
query service, schema engine, or pagination.

## MVP Experience

### Upload Page

- Select or drag in an `.xlsx` workbook.
- See its name, event count, headers, and first few rows.
- See clear validation errors for incorrect headers or unusable data.
- Confirm that the file should replace the active dataset.
- Continue automatically to the event catalog after success.

### Events Home Page

- View all matching events as responsive cards.
- Search event name, organization, location, and contact fields.
- Filter by city, state, country, organization, and date.
- Sort by date or event name.
- See the number of matching events.
- Clear all filters in one action.
- Open available event links, email addresses, and phone numbers.
- Navigate to the upload page from a small header action.

## Card Content

Cards should prioritize:

1. `Event Name`
2. `Event Date` and `Event Time`
3. `Event Org/School`
4. `Address`, `City`, `State`, and `Country`
5. `Event URL`
6. Available contact person, phone, and email

Repeated or unavailable values should not create empty labels or visual
clutter.

## Success Criteria

- A workbook matching the reference headers can be previewed and activated.
- Invalid workbooks do not replace the active data.
- All valid event rows appear as cards.
- Search, filters, and sorting work together.
- Date ranges display correctly and sort by their first date.
- Missing values are omitted cleanly.
- The layout is usable on desktop and mobile.
- The active workbook survives a normal server restart.

## Out of Scope

- Authentication and user accounts
- Multiple active workbooks
- Database storage
- Schema mapping or configurable fields
- Editing events in the browser
- Separate event detail routes
- Category filters, because the reference schema has no category column
- Calendar, ticketing, registration, or payment integrations
- Cloud storage and automated workbook synchronization
- Pagination for the current dataset size
- Deployment infrastructure

## Future Direction

Future work should be driven by actual use. Possible additions include
authentication for uploads, larger-dataset pagination, calendar export, cloud
storage, or scheduled imports. None of these should shape the MVP
implementation prematurely.
