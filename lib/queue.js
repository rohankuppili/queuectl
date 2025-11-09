import { insertJob, listJobs as dbListJobs } from "./db.js";
import { v4 as uuidv4 } from "uuid";
import chalk from "chalk";

export async function enqueueJob(job) {
  const newJob = {
    id: job.id || uuidv4(),
    command: job.command,
    state: "pending",
    attempts: 0,
    max_retries: job.max_retries || 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  insertJob(newJob);
}

export async function listJobs(options) {
  const rows = dbListJobs(options.state);
  console.table(rows);
}

export async function showStatus() {
  const all = dbListJobs();
  const summary = all.reduce((acc, j) => {
    acc[j.state] = (acc[j.state] || 0) + 1;
    return acc;
  }, {});
  console.table(summary);
}
