import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import pricesRouter from "./routes/prices.js";
import { createOhlcvTable } from "./scripts/backfillCoindesk.js"; // 👈 Add this

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
initDb();
createOhlcvTable(); // 👈 Add this

app.use("/api/prices", pricesRouter);

app.listen(port, () => console.log(`✅ Backend listening on port ${port}`));
