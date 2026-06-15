import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Point storage at a throwaway data dir BEFORE importing modules that read it.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "global-events-test-"));
process.env.GLOBAL_EVENTS_DATA_DIR = tmpDir;

const { createApp } = await import("./app.js");
const { seedActiveDataset } = await import("./storage.js");
const { REQUIRED_HEADERS } = await import("./workbook.js");
const request = (await import("supertest")).default;
const XLSX = await import("xlsx");

function makeWorkbook(rows: (string | null)[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Normalized Events");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const HEADER_ROW = [...REQUIRED_HEADERS];
const VALID_ROW = [
  "2026-06-12",
  "2:00 PM",
  "Aquinas College",
  "Original Event",
  "https://example.com",
  "missing",
  "(616) 632-2900",
  "missing",
  "1700 Fulton St E",
  "Grand Rapids",
  "MI",
  "United States",
];

const app = createApp();
const activeFile = path.join(tmpDir, "active.xlsx");

beforeAll(() => {
  // Seed a known-good active dataset.
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(activeFile, makeWorkbook([HEADER_ROW, VALID_ROW]));
  fs.writeFileSync(
    path.join(tmpDir, "active.meta.json"),
    JSON.stringify({ originalName: "seed.xlsx", updatedAt: new Date().toISOString(), eventCount: 1 }),
  );
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("POST /api/upload", () => {
  it("previews a valid workbook without replacing active data", async () => {
    const before = fs.readFileSync(activeFile);
    const res = await request(app)
      .post("/api/upload")
      .attach("file", makeWorkbook([HEADER_ROW, VALID_ROW, VALID_ROW]), "new.xlsx");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.activated).toBe(false);
    expect(res.body.rowCount).toBe(2);
    expect(res.body.headers).toEqual([...REQUIRED_HEADERS]);
    // Active file is unchanged by a preview.
    expect(fs.readFileSync(activeFile).equals(before)).toBe(true);
  });

  it("rejects an invalid workbook and leaves active data unchanged", async () => {
    const before = fs.readFileSync(activeFile);
    const badHeaders = HEADER_ROW.slice(0, 11); // drop a required header
    const res = await request(app)
      .post("/api/upload")
      .field("confirm", "true")
      .attach("file", makeWorkbook([badHeaders, VALID_ROW.slice(0, 11)]), "bad.xlsx");

    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
    // The rejected upload did not overwrite the active workbook.
    expect(fs.readFileSync(activeFile).equals(before)).toBe(true);
  });

  it("replaces active data when confirm=true and the workbook is valid", async () => {
    const res = await request(app)
      .post("/api/upload")
      .field("confirm", "true")
      .attach("file", makeWorkbook([HEADER_ROW, VALID_ROW, VALID_ROW, VALID_ROW]), "replacement.xlsx");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.activated).toBe(true);
    expect(res.body.rowCount).toBe(3);

    // The new dataset is now served.
    const events = await request(app).get("/api/events");
    expect(events.status).toBe(200);
    expect(events.body.events).toHaveLength(3);
    expect(events.body.meta.fileName).toBe("replacement.xlsx");
  });

  it("removes temporary write directories after replacement", () => {
    const leftovers = fs
      .readdirSync(tmpDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(".write-"));

    expect(leftovers).toHaveLength(0);
  });

  it("seedActiveDataset keeps an existing active file intact", () => {
    const before = fs.readFileSync(activeFile);
    seedActiveDataset();
    expect(fs.readFileSync(activeFile).equals(before)).toBe(true);
  });

  it("rate limits repeated upload attempts", async () => {
    const limitedApp = createApp();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await request(limitedApp).post("/api/upload");
      expect(response.status).toBe(400);
    }

    const blocked = await request(limitedApp).post("/api/upload");
    expect(blocked.status).toBe(429);
    expect(blocked.body.errors).toContain(
      "Too many upload attempts. Please wait before trying again.",
    );
  });
});
