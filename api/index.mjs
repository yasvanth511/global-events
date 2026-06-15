// Vercel serverless entry. Re-exports the built Express app so all /api/* routes
// are handled by a single function. The server is compiled to server/dist by the
// project build command before functions are bundled.
import app from "../server/dist/serverless.js";

export default app;
