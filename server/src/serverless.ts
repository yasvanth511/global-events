import { createApp } from "./app.js";
import { seedActiveDataset } from "./storage.js";

// Best-effort seed (writes to a temp dir on serverless; reads fall back to the
// bundled reference workbook if the filesystem is read-only).
seedActiveDataset();

// An Express app is a valid (req, res) handler, so it can be exported directly
// as a serverless function.
const app = createApp();
export default app;
