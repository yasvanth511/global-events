import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { parseWorkbook } from "./workbook.js";
import type { ActiveMeta, EventRecord } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Repo root is two levels up from both server/src (tsx dev) and server/dist (build).
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// The data directory can be overridden (used by tests to avoid touching real data).
const DATA_DIR = process.env.GLOBAL_EVENTS_DATA_DIR
  ? path.resolve(process.env.GLOBAL_EVENTS_DATA_DIR)
  : path.join(REPO_ROOT, "data");
const ACTIVE_FILE = path.join(DATA_DIR, "active.xlsx");
const META_FILE = path.join(DATA_DIR, "active.meta.json");
const REFERENCE_FILE = path.join(REPO_ROOT, "technical_events_normalized.xlsx");

/**
 * Location of the built client (used to serve the SPA from the API process in
 * production, e.g. the Docker image). In dev the client is served by Vite, so
 * this directory simply won't exist and static serving is skipped.
 */
export function getClientDistDir(): string {
  return process.env.CLIENT_DIST_DIR
    ? path.resolve(process.env.CLIENT_DIST_DIR)
    : path.join(REPO_ROOT, "client", "dist");
}

export function hasActiveDataset(): boolean {
  return fs.existsSync(ACTIVE_FILE);
}

/** Copy the reference workbook into place on first run so the app has data. */
export function seedActiveDataset(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (hasActiveDataset()) return;
  if (!fs.existsSync(REFERENCE_FILE)) return;

  const buffer = fs.readFileSync(REFERENCE_FILE);
  const parsed = parseWorkbook(buffer);
  if (!parsed.ok) return;

  fs.writeFileSync(ACTIVE_FILE, buffer);
  writeMeta({
    originalName: "technical_events_normalized.xlsx",
    updatedAt: new Date().toISOString(),
    eventCount: parsed.events.length,
  });
}

/** Atomically replace the active workbook after validation has already passed. */
export function replaceActiveDataset(buffer: Buffer, originalName: string, eventCount: number): ActiveMeta {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${ACTIVE_FILE}.tmp`;
  fs.writeFileSync(tmp, buffer);
  fs.renameSync(tmp, ACTIVE_FILE);

  const meta: ActiveMeta = {
    originalName: safeOriginalName(originalName),
    updatedAt: new Date().toISOString(),
    eventCount,
  };
  writeMeta(meta);
  return meta;
}

export function readActiveEvents(): { events: EventRecord[]; meta: ActiveMeta } | null {
  if (!hasActiveDataset()) return null;
  const buffer = fs.readFileSync(ACTIVE_FILE);
  const parsed = parseWorkbook(buffer);
  if (!parsed.ok) return null;
  return { events: parsed.events, meta: readMeta(parsed.events.length) };
}

export function readActiveMeta(): ActiveMeta | null {
  if (!hasActiveDataset()) return null;
  const buffer = fs.readFileSync(ACTIVE_FILE);
  const parsed = parseWorkbook(buffer);
  return readMeta(parsed.ok ? parsed.events.length : 0);
}

function readMeta(fallbackCount: number): ActiveMeta {
  try {
    const raw = JSON.parse(fs.readFileSync(META_FILE, "utf8")) as Partial<ActiveMeta>;
    return {
      originalName: raw.originalName ?? "active.xlsx",
      updatedAt: raw.updatedAt ?? fs.statSync(ACTIVE_FILE).mtime.toISOString(),
      eventCount: typeof raw.eventCount === "number" ? raw.eventCount : fallbackCount,
    };
  } catch {
    return {
      originalName: "active.xlsx",
      updatedAt: fs.statSync(ACTIVE_FILE).mtime.toISOString(),
      eventCount: fallbackCount,
    };
  }
}

function writeMeta(meta: ActiveMeta): void {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

/** Never trust an uploaded filename as a path; keep only a clean base name for display. */
function safeOriginalName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ]+/g, "_").trim();
  return base || "uploaded.xlsx";
}
