import express from "express";
import configRoutes from "./routes/index.js";
import { appointmentReminder } from "./data/pet.js";
import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname + "/public")));

configRoutes(app);

cron.schedule("0 8 * * *", async () => {
  try {
    await appointmentReminder();
  } catch (error) {
    console.error("Error running reminders:", error);
  }
});

const port = process.env.PORT || 8000;
const host = "0.0.0.0";

app.listen(port, host, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
