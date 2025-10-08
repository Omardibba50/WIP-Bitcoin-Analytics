import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db = null;

export function initDb(dbPath = path.join(process.cwd(), "data", "prices.sqlite")) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (db) return db;
  db = new Database(dbPath);
  return db;
}

export function getDb() {
  if (!db) return initDb();
  return db;
}
