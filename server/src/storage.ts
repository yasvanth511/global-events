import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { parseWorkbook } from "./workbook.js";
import type { ActiveMeta, EventRecord } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Repo root is two levels up from both server/src (tsx dev) and server/dist (build).
const REPO_ROOT = path.resolve(__dirname, "..", "..");

/**
 * Where the active workbook is written. Order of preference:
 *   1. GLOBAL_EVENTS_DATA_DIR (explicit override; used by tests and Docker).
 *   2. A temp dir on read-only serverless hosts (e.g. Vercel), where only the
 *      OS temp directory is writable. Uploads work for a warm instance but are
 *      not durable across cold starts.
 *   3. <repoRoot>/data for normal local/Docker runs (durable).
 */
const DATA_DIR = process.env.GLOBAL_EVENTS_DATA_DIR
  ? path.resolve(process.env.GLOBAL_EVENTS_DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), "global-events-data")
    : path.join(REPO_ROOT, "data");
const ACTIVE_FILE = path.join(DATA_DIR, "active.xlsx");
const META_FILE = path.join(DATA_DIR, "active.meta.json");
const REFERENCE_FILE = path.join(REPO_ROOT, "technical_events_normalized.xlsx");
const REFERENCE_NAME = "technical_events_normalized.xlsx";

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

/** True when there is any dataset to serve — an uploaded active file or the bundled reference. */
export function hasActiveDataset(): boolean {
  return fs.existsSync(ACTIVE_FILE) || fs.existsSync(REFERENCE_FILE);
}

/**
 * Copy the reference workbook into place on first run so the app has data.
 * On read-only filesystems this is best-effort; the read path falls back to the
 * bundled reference workbook, so failing to seed is not fatal.
 */
export function seedActiveDataset(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(ACTIVE_FILE)) return;
    if (!fs.existsSync(REFERENCE_FILE)) return;

    const buffer = fs.readFileSync(REFERENCE_FILE);
    const parsed = parseWorkbook(buffer);
    if (!parsed.ok) return;

    fs.writeFileSync(ACTIVE_FILE, buffer);
    writeMeta({
      originalName: REFERENCE_NAME,
      updatedAt: new Date().toISOString(),
      eventCount: parsed.events.length,
    });
  } catch {
    // Read-only filesystem (e.g. serverless). Reads fall back to the reference.
  }
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
  const source = resolveActiveSource();
  if (!source) return null;
  const parsed = parseWorkbook(source.buffer);
  if (!parsed.ok) return null;
  return { events: parsed.events, meta: buildMeta(source, parsed.events.length) };
}

export function readActiveMeta(): ActiveMeta | null {
  const source = resolveActiveSource();
  if (!source) return null;
  const parsed = parseWorkbook(source.buffer);
  return buildMeta(source, parsed.ok ? parsed.events.length : 0);
}

type ActiveSource = { buffer: Buffer; file: string; fromReference: boolean };

/** Prefer an uploaded active workbook; otherwise fall back to the bundled reference. */
function resolveActiveSource(): ActiveSource | null {
  if (fs.existsSync(ACTIVE_FILE)) {
    return { buffer: fs.readFileSync(ACTIVE_FILE), file: ACTIVE_FILE, fromReference: false };
  }
  if (fs.existsSync(REFERENCE_FILE)) {
    return { buffer: fs.readFileSync(REFERENCE_FILE), file: REFERENCE_FILE, fromReference: true };
  }
  return null;
}

function buildMeta(source: ActiveSource, fallbackCount: number): ActiveMeta {
  if (source.fromReference) {
    return {
      originalName: REFERENCE_NAME,
      updatedAt: fs.statSync(source.file).mtime.toISOString(),
      eventCount: fallbackCount,
    };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(META_FILE, "utf8")) as Partial<ActiveMeta>;
    return {
      originalName: raw.originalName ?? "active.xlsx",
      updatedAt: raw.updatedAt ?? fs.statSync(source.file).mtime.toISOString(),
      eventCount: typeof raw.eventCount === "number" ? raw.eventCount : fallbackCount,
    };
  } catch {
    return {
      originalName: "active.xlsx",
      updatedAt: fs.statSync(source.file).mtime.toISOString(),
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
