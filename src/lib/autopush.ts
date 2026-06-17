// ScanWise auto-push loop — runs inside the Next.js server process.
// Calls runAutoPushCycle() every 30s. Logs to scripts/autopush.log.
// Every git op is wrapped in try/catch so a single failure never kills the loop.

import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REPO = resolve(process.cwd());
const LOG_PATH = resolve(REPO, "scripts/autopush.log");
const POLL_INTERVAL_MS = 30_000;
const BRANCH = "main";

function log(message: string): void {
  const ts = new Date().toISOString();
  const line = `${ts} ${message}\n`;
  try {
    mkdirSync(dirname(LOG_PATH), { recursive: true });
    appendFileSync(LOG_PATH, line, "utf8");
  } catch {
    // ignore — never crash the server on log failure
  }
  // also echo to server stdout for visibility
  process.stdout.write(`[autopush] ${line}`);
}

function runGit(args: string[]): { ok: boolean; out: string } {
  try {
    const out = execFileSync("git", args, {
      cwd: REPO,
      encoding: "utf8",
      timeout: 120_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, out };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, out: msg };
  }
}

function runAutoPushCycle(): void {
  // 1. Fetch remote (best-effort)
  runGit(["fetch", "origin", BRANCH]);

  // 2. Rebase any remote changes
  runGit(["pull", "--rebase", "--autostash", "origin", BRANCH]);

  // 3. Check for pending changes
  const status = runGit(["status", "--porcelain"]);
  if (!status.ok) {
    log(`ERROR: git status failed: ${status.out}`);
    return;
  }
  const pending = status.out.trim();
  if (!pending) return; // nothing to do

  // 4. Stage everything not gitignored
  runGit(["add", "-A"]);

  // 5. Build summary
  const diffStat = runGit(["diff", "--cached", "--stat"]);
  const summary =
    diffStat.out.trim().split("\n").pop() || "(no diff)";

  // 6. Commit
  const ts = new Date().toISOString();
  const commitMsg = `auto: ${ts} — ${summary}`;
  const commit = runGit(["commit", "-m", commitMsg, "--quiet"]);
  if (!commit.ok) {
    log(`INFO: commit failed (likely nothing to commit): ${commit.out}`);
    return;
  }

  // 7. Push
  const push = runGit(["push", "origin", BRANCH]);
  if (push.ok) {
    const sha = runGit(["rev-parse", "--short", "HEAD"]).out.trim();
    log(`pushed @ ${sha}: ${summary}`);
  } else {
    log(`ERROR: push failed: ${push.out}`);
  }
}

let started = false;

export function startAutoPush(): void {
  if (started) return; // guard against double-registration in dev HMR
  started = true;

  log(`=== ScanWise autopush started inside Next.js server (PID ${process.pid}) ===`);
  log(`poll interval: ${POLL_INTERVAL_MS}ms | branch: ${BRANCH}`);

  // Run one cycle immediately so we don't wait 30s for the first push.
  try {
    runAutoPushCycle();
  } catch (err) {
    log(`initial cycle error: ${err}`);
  }

  // Then poll forever.
  setInterval(() => {
    try {
      runAutoPushCycle();
    } catch (err) {
      log(`cycle error (continuing): ${err}`);
    }
  }, POLL_INTERVAL_MS);
}
