import { exec } from "child_process";
import { getNextPendingJob, updateJobState, moveToDLQ } from "./db.js";
import { getConfigValue } from "./config.js";

let active = true;

export async function startWorkers(count = 1) {
  console.log(`🚀 Starting ${count} workers...`);
  for (let i = 0; i < count; i++) runWorker(i + 1);
}

export async function stopWorkers() {
  console.log("🛑 Stopping workers gracefully...");
  active = false;
}

async function runWorker(id) {
  while (active) {
    const job = getNextPendingJob();
    if (!job) {
      await sleep(1000);
      continue;
    }

    updateJobState(job.id, "processing", job.attempts + 1);
    console.log(`⚙️ Worker ${id} processing job ${job.id}...`);

    exec(job.command, async (error) => {
      if (!error) {
        updateJobState(job.id, "completed");
        console.log(`✅ Job ${job.id} completed`);
      } else {
        const base = parseInt(await getConfigValue("backoff_base")) || 2;
        const delay = Math.pow(base, job.attempts);
        if (job.attempts >= job.max_retries) {
          moveToDLQ(job, error.message);
          console.log(`💀 Job ${job.id} moved to DLQ`);
        } else {
          updateJobState(job.id, "pending");
          console.log(
            `🔁 Job ${job.id} failed (retrying in ${delay}s): ${error.message}`
          );
          await sleep(delay * 1000);
        }
      }
    });

    await sleep(2000);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
