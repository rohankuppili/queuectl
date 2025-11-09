import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.resolve("queuectl.db");
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  command TEXT,
  state TEXT,
  attempts INTEGER,
  max_retries INTEGER,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS dlq (
  id TEXT PRIMARY KEY,
  command TEXT,
  reason TEXT,
  moved_at TEXT
);
`);

export function insertJob(job) {
  const stmt = db.prepare(`
    INSERT INTO jobs (id, command, state, attempts, max_retries, created_at, updated_at)
    VALUES (@id, @command, @state, @attempts, @max_retries, @created_at, @updated_at)
  `);
  stmt.run(job);
}

export function updateJobState(id, state, attempts = null) {
  const stmt = db.prepare(`
    UPDATE jobs
    SET state = ?, attempts = COALESCE(?, attempts), updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(state, attempts, id);
}

export function getNextPendingJob() {
  return db.prepare("SELECT * FROM jobs WHERE state = 'pending' LIMIT 1").get();
}

export function listJobs(state) {
  if (state)
    return db.prepare("SELECT * FROM jobs WHERE state = ?").all(state);
  return db.prepare("SELECT * FROM jobs").all();
}

export function moveToDLQ(job, reason) {
  const stmt = db.prepare(`
    INSERT INTO dlq (id, command, reason, moved_at)
    VALUES (?, ?, ?, datetime('now'))
  `);
  stmt.run(job.id, job.command, reason);
  db.prepare("DELETE FROM jobs WHERE id = ?").run(job.id);
}

export function listDLQ() {
  const rows = db.prepare("SELECT * FROM dlq").all();
  console.table(rows);
}

export function retryDLQJob(id) {
  const row = db.prepare("SELECT * FROM dlq WHERE id = ?").get(id);
  if (!row) return console.log("Job not found in DLQ.");
  insertJob({
    id: row.id,
    command: row.command,
    state: "pending",
    attempts: 0,
    max_retries: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  db.prepare("DELETE FROM dlq WHERE id = ?").run(id);
  console.log("✅ Job moved back from DLQ to queue.");
}
