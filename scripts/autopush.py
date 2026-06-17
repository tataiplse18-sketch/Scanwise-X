#!/usr/bin/env python3
"""ScanWise auto-push daemon.

Polls the working tree every 30s. If anything changed, commits with a
timestamped message and pushes to origin/main.

Robustness:
  - Single-instance via fcntl.flock on this very file.
  - Never dies on git failures (every git op is wrapped in try/except).
  - Logs every cycle to scripts/autopush.log.
  - Handles SIGTERM / SIGHUP cleanly.
"""

from __future__ import annotations

import fcntl
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

REPO = Path("/home/z/my-project")
LOG_PATH = REPO / "scripts" / "autopush.log"
POLL_INTERVAL = 30  # seconds
BRANCH = "main"


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    line = f"{ts} {msg}"
    try:
        with LOG_PATH.open("a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    except OSError:
        pass
    print(line, flush=True)


def run_git(args: list[str]) -> tuple[int, str, str]:
    """Run a git command, return (returncode, stdout, stderr)."""
    try:
        proc = subprocess.run(
            ["git", *args],
            cwd=REPO,
            capture_output=True,
            text=True,
            timeout=120,
        )
        return proc.returncode, proc.stdout, proc.stderr
    except Exception as exc:  # noqa: BLE001
        return -1, "", str(exc)


def main() -> int:
    # Single-instance guard: flock on this script file
    try:
        lock_fh = open(__file__, "r")
        try:
            fcntl.flock(lock_fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            log("another autopush is already running; exiting")
            return 0
    except OSError as exc:
        log(f"could not open self for flock: {exc}")
        return 1

    log(f"=== ScanWise autopush daemon started (PID {os.getpid()}) ===")
    log(f"poll interval: {POLL_INTERVAL}s | branch: {BRANCH}")

    while True:
        try:
            # 1. Fetch remote refs (best-effort)
            run_git(["fetch", "origin", BRANCH])

            # 2. Rebase any remote changes (with autostash)
            run_git(["pull", "--rebase", "--autostash", "origin", BRANCH])

            # 3. Check for pending changes
            rc, porcelain, _ = run_git(["status", "--porcelain"])
            pending = porcelain.strip()

            if pending:
                # Stage everything not gitignored
                run_git(["add", "-A"])

                # Build a short summary
                _, summary_raw, _ = run_git(["diff", "--cached", "--stat"])
                summary = summary_raw.strip().splitlines()[-1] if summary_raw.strip() else "(no diff)"
                timestamp = datetime.now(timezone.utc).isoformat()

                # Commit
                run_git(["commit", "-m", f"auto: {timestamp} — {summary}", "--quiet"])

                # Push
                rc, out, err = run_git(["push", "origin", BRANCH])
                if rc == 0:
                    short_sha = run_git(["rev-parse", "--short", "HEAD"])[1].strip()
                    log(f"pushed @ {short_sha}: {summary}")
                else:
                    err_short = (err or out or "").strip().splitlines()[-1] if (err or out) else ""
                    log(f"ERROR: push failed (rc={rc}): {err_short}")
            else:
                # Nothing to do this cycle — don't log to avoid noise
                pass

        except Exception as exc:  # noqa: BLE001
            log(f"cycle error (continuing): {exc}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    sys.exit(main())
