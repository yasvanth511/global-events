import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { uploadWorkbook } from "../lib/api";
import type { UploadResult } from "../types";

type Phase = "idle" | "previewing" | "previewed" | "confirming";

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<UploadResult | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = phase === "previewing" || phase === "confirming";
  const canActivate = preview?.ok === true && phase === "previewed";

  async function handleFile(selected: File) {
    setError(null);
    setPreview(null);
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setError("Please choose an .xlsx workbook.");
      setFile(null);
      return;
    }
    setFile(selected);
    setPhase("previewing");
    try {
      const result = await uploadWorkbook(selected, false);
      setPreview(result);
      setPhase("previewed");
    } catch {
      setError("Could not reach the server to validate the file.");
      setPhase("idle");
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setPhase("confirming");
    setError(null);
    try {
      const result = await uploadWorkbook(file, true);
      if (result.ok && result.activated) {
        navigate("/");
        return;
      }
      setPreview(result);
      setPhase("previewed");
    } catch {
      setError("Could not reach the server to replace the dataset.");
      setPhase("previewed");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) void handleFile(dropped);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Upload event workbook</h1>
        <Link
          to="/"
          className="text-sm font-medium text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          ← Back to catalog
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p>
          Upload one <span className="font-medium text-slate-900">.xlsx</span> file (max 10 MB). The first worksheet must use
          these exact headers, in order:
        </p>
        <p className="mt-2 font-mono text-xs text-slate-500">
          Event Date · Event Time · Event Org/School · Event Name · Event URL · Contact Person · Contact Phone · Contact Email ·
          Address · City · State · Country
        </p>
      </div>

      <label
        htmlFor="file-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${
          dragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white hover:bg-slate-50"
        }`}
      >
        <input
          id="file-input"
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="sr-only"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void handleFile(selected);
          }}
        />
        <p className="text-sm font-medium text-slate-700">Drag and drop a workbook here</p>
        <p className="mt-1 text-xs text-slate-500">or click to choose a file</p>
        {file && <p className="mt-3 text-sm text-slate-900">Selected: {file.name}</p>}
      </label>

      {busy && (
        <p className="text-sm text-slate-600" role="status">
          {phase === "previewing" ? "Validating workbook…" : "Replacing active dataset…"}
        </p>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {preview && preview.errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <p className="font-semibold">This workbook cannot be used:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {preview.errors.slice(0, 10).map((message) => (
              <li key={message}>{message}</li>
            ))}
            {preview.errors.length > 10 && <li>…and {preview.errors.length - 10} more.</li>}
          </ul>
        </div>
      )}

      {preview && preview.ok && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="text-slate-600">
              File: <span className="font-medium text-slate-900">{preview.fileName}</span>
            </span>
            <span className="text-slate-600">
              Events: <span className="font-medium text-slate-900">{preview.rowCount}</span>
            </span>
          </div>

          {preview.headers && preview.sampleRows && (
            <div className="overflow-x-auto">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">First rows preview</p>
              <table className="min-w-full border-collapse text-left text-xs">
                <thead>
                  <tr>
                    {preview.headers.map((header) => (
                      <th key={header} className="whitespace-nowrap border-b border-slate-200 px-2 py-1.5 font-semibold text-slate-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-slate-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="whitespace-nowrap px-2 py-1.5 text-slate-600">
                          {cell ?? <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={!canActivate || busy}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Replace active dataset
            </button>
            <span className="text-xs text-slate-500">This replaces the current catalog with the {preview.rowCount} events above.</span>
          </div>
        </div>
      )}
    </div>
  );
}
