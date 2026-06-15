import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { parseWorkbook } from "./workbook.js";
import {
  getClientDistDir,
  hasActiveDataset,
  readActiveEvents,
  readActiveMeta,
  replaceActiveDataset,
} from "./storage.js";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const GENERAL_RATE_LIMIT = 500;
const UPLOAD_RATE_LIMIT = 20;
const UPLOAD_RATE_WINDOW_MS = 15 * 60 * 1000;

const XLSX_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
  "application/zip",
  "",
]);

const uploadFieldsSchema = z.object({
  confirm: z.string().optional(),
});

export function createApp(): Express {
  const app = express();

  app.use(
    rateLimit({
      windowMs: UPLOAD_RATE_WINDOW_MS,
      limit: GENERAL_RATE_LIMIT,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  const uploadRateLimiter = rateLimit({
    windowMs: UPLOAD_RATE_WINDOW_MS,
    limit: UPLOAD_RATE_LIMIT,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        ok: false,
        errors: ["Too many upload attempts. Please wait before trying again."],
      });
    },
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      const isXlsxName = file.originalname.toLowerCase().endsWith(".xlsx");
      if (isXlsxName && XLSX_MIME.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only .xlsx files are accepted."));
      }
    },
  });

  app.get("/api/status", (_req, res) => {
    const meta = readActiveMeta();
    res.json({
      hasActiveDataset: hasActiveDataset() && meta !== null,
      fileName: meta?.originalName ?? null,
      eventCount: meta?.eventCount ?? null,
      updatedAt: meta?.updatedAt ?? null,
    });
  });

  app.get("/api/events", (_req, res) => {
    const active = readActiveEvents();
    if (!active) {
      res.status(404).json({ error: "No active dataset. Upload a workbook to get started." });
      return;
    }
    res.json({
      events: active.events,
      meta: {
        fileName: active.meta.originalName,
        eventCount: active.meta.eventCount,
        updatedAt: active.meta.updatedAt,
      },
    });
  });

  app.post("/api/upload", uploadRateLimiter, (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        const message =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? "The file exceeds the 10 MB limit."
            : err.message || "Upload failed.";
        res.status(400).json({ ok: false, errors: [message] });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ ok: false, errors: ["No file was provided."] });
        return;
      }

      const fields = uploadFieldsSchema.safeParse(req.body ?? {});
      const confirm = fields.success && fields.data.confirm === "true";

      const parsed = parseWorkbook(file.buffer);

      // Validation failed: report errors and leave the active dataset untouched.
      if (!parsed.ok) {
        res.status(422).json({
          ok: false,
          fileName: file.originalname,
          headers: parsed.headers,
          rowCount: parsed.events.length,
          sampleRows: parsed.sampleRows,
          errors: parsed.errors,
        });
        return;
      }

      if (!confirm) {
        // Preview only — do not replace the active workbook.
        res.json({
          ok: true,
          activated: false,
          fileName: file.originalname,
          headers: parsed.headers,
          rowCount: parsed.events.length,
          sampleRows: parsed.sampleRows,
          errors: [],
        });
        return;
      }

      const meta = replaceActiveDataset(file.buffer, file.originalname, parsed.events.length);
      res.json({
        ok: true,
        activated: true,
        fileName: meta.originalName,
        rowCount: meta.eventCount,
        updatedAt: meta.updatedAt,
        errors: [],
      });
    });
  });

  // In production (e.g. the Docker image) the built client is served by this
  // same process, with an SPA fallback for client-side routes like /upload.
  // In dev this directory is absent, so Vite keeps serving the client.
  const clientDist = getClientDistDir();
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  return app;
}
