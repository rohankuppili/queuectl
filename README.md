QueueCTL — CLI-Based Background Job Queue System

A simple yet production-ready CLI background job queue system built using Node.js and SQLite.

This tool (queuectl) allows you to enqueue jobs, run worker processes, handle retries with exponential backoff, and manage a Dead Letter Queue (DLQ) for permanently failed jobs — all from the command line.

Features

Enqueue and manage background jobs

Multiple parallel worker processes

Automatic retry with exponential backoff

Persistent SQLite storage (jobs survive restarts)

Dead Letter Queue (DLQ) for permanently failed jobs

Configurable retry count & backoff base

CLI interface using commander

Graceful worker shutdown

Clear architecture & modular code

Tech Stack

Language: Node.js (v18+)

Database: SQLite (via better-sqlite3)

CLI Framework: Commander.js

Utilities: Chalk, UUID, ShellJS

Installation & Setup
# Clone your repository
git clone https://github.com/<your-username>/queuectl.git
cd queuectl

# Install dependencies
npm install


For Windows users, run setup in PowerShell.

Usage
1. Enqueue a job
node bin/queuectl enqueue '{"id":"job1","command":"echo Hello QueueCTL"}'

2. Start workers
node bin/queuectl worker --start --count 2

3. Stop workers
node bin/queuectl worker --stop

4. View status summary
node bin/queuectl status

5. List jobs by state
node bin/queuectl list --state pending
node bin/queuectl list --state completed

6. Dead Letter Queue (DLQ)
node bin/queuectl dlq list
node bin/queuectl dlq retry job1

7. Config management
node bin/queuectl config set max-retries 3
node bin/queuectl config set backoff_base 2
node bin/queuectl config get backoff_base

Job Lifecycle
State	Description
pending	Waiting to be picked up by a worker
processing	Currently being executed
completed	Successfully executed
failed	Failed but retryable
dead	Permanently failed, moved to DLQ
Exponential Backoff Logic

When a job fails, it retries after a delay based on exponential backoff:

delay = base ^ attempts  (in seconds)


For example, with base=2:

1st retry → 2s

2nd retry → 4s

3rd retry → 8s

Once max_retries is reached, the job moves to the Dead Letter Queue.

Persistence

Jobs and configurations are stored in a local SQLite database (queuectl.db), ensuring data survives restarts.

Tables:

jobs — active and completed jobs

config — retry and backoff settings

dlq — permanently failed jobs

Architecture Overview
queuectl/
├── bin/
│   └── queuectl          # CLI entry point
├── lib/
│   ├── db.js             # Database & persistence
│   ├── queue.js          # Enqueue, list, status logic
│   ├── worker.js         # Worker management & retries
│   ├── config.js         # Config management (retry/backoff)
├── scripts/
│   └── test-flows.ps1    # PowerShell test script
├── package.json
├── queuectl.db           # (auto-created at runtime)
└── README.md

Flow Summary

Enqueue job → Stored in SQLite with state pending

Worker picks job → Sets state processing

Command executed (via child_process.exec)

Success → completed

Failure → Retry (exponential backoff)

Exhausted retries → Move to DLQ

DLQ jobs can be retried manually

Testing Instructions
Option 1: PowerShell script
pwsh scripts/test-flows.ps1

Option 2: Manual testing

Enqueue jobs (some valid, some invalid commands)

Start multiple workers

Check job statuses

Inspect DLQ (node bin/queuectl dlq list)

Retry DLQ job (node bin/queuectl dlq retry <jobid>)

Configuration
Key	Description	Example
max-retries	Maximum retry attempts per job	3
backoff_base	Base value for exponential backoff	2

Stored persistently in the SQLite config table.

Assumptions & Trade-offs

SQLite chosen for simplicity and durability.

Jobs run using system shell (child_process.exec).

No job priority or scheduling (optional bonus feature).

CLI runs in Node environment (no Docker required).

Graceful shutdown ensures current job finishes before exit.

Future Improvements

Job timeout handling

Job priority queues

Scheduled or delayed jobs

Job output logging

Web dashboard for monitoring

Example Output
> node bin/queuectl enqueue '{"command":"echo Hello"}'
Job enqueued successfully

> node bin/queuectl worker --start --count 2
Starting 2 workers...
Worker 1 processing job job1...
Job job1 completed

> node bin/queuectl status
┌────────────┬────────┐
│ State      │ Count  │
├────────────┼────────┤
│ completed  │ 1      │
│ pending    │ 0      │
└────────────┴────────┘


Developed for: QueueCTL Backend Developer Internship Assignment
Developed by: Rohan Kuppili
Language: Node.js