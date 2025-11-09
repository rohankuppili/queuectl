import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve("queuectl.db"));

export async function setConfig(key, value) {
  db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(
    key,
    value
  );
  console.log(`✅ Config ${key} set to ${value}`);
}

export async function getConfig(key) {
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key);
  console.log(row ? `${key}: ${row.value}` : "Config not found");
}

export async function getConfigValue(key) {
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key);
  return row ? row.value : null;
}
