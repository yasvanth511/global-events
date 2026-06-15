import { createApp } from "./app.js";
import { seedActiveDataset } from "./storage.js";

const PORT = Number(process.env.PORT) || 3001;

seedActiveDataset();

const app = createApp();
app.listen(PORT, () => {
  console.log(`Global Events API listening on http://localhost:${PORT}`);
});
