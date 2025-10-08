import { Router } from "express";
import { getDb } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM ohlcv ORDER BY timestamp DESC LIMIT 100").all();
    res.json(rows);
  } catch (err) {
    console.error("Error fetching prices:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
