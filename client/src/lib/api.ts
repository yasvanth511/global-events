import type { EventsResponse, StatusResponse, UploadResult } from "../types";

export async function fetchEvents(): Promise<EventsResponse> {
  const res = await fetch("/api/events");
  if (res.status === 404) {
    // No active dataset yet — surface as an empty, clearly-flagged result.
    const empty: EventsResponse = {
      events: [],
      meta: { fileName: "", eventCount: 0, updatedAt: "" },
    };
    return empty;
  }
  if (!res.ok) {
    throw new Error(`Failed to load events (${res.status}).`);
  }
  return (await res.json()) as EventsResponse;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error(`Failed to load status (${res.status}).`);
  return (await res.json()) as StatusResponse;
}

export async function uploadWorkbook(file: File, confirm: boolean): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("confirm", confirm ? "true" : "false");

  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({ ok: false, errors: ["Unexpected server response."] }))) as UploadResult;
  if (!data.errors) data.errors = [];
  return data;
}
