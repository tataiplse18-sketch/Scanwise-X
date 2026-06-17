#!/usr/bin/env bash
# ScanWise auto-push daemon
# Polls the working tree every 30s. If anything changed, commits with a
# timestamped message and pushes to origin/main.
#
# Logs to /home/z/my-project/scripts/autopush.log
#
# Robustness:
#   - `set +e` so a single git failure doesn't kill the daemon
#   - Never commits .env / node_modules / .next / dev.log (gitignored)
#   - Never commits download/, upload/, .zscripts/, db/, examples/,
#     mini-services/, Caddyfile (all gitignored)
#   - Single-instance: uses a flock on this very script
#   - On push failure: logs and retries next cycle
#   - Pulls --rebase first so manual edits on GitHub don't conflict

set +e
set -u

REPO="/home/z/my-project"
LOG="/home/z/my-project/scripts/autopush.log"
POLL_INTERVAL=30
BRANCH="main"

cd "$REPO" || { echo "cannot cd to $REPO" >> "$LOG"; exit 1; }

# Single-instance guard — flock on this script file itself
exec 9<"$0"
if ! flock -n 9; then
  echo "$(date -Iseconds) another autopush is already running; exiting" >> "$LOG"
  exit 0
fi

log() {
  echo "$(date -Iseconds) $*" >> "$LOG"
}

log "=== ScanWise autopush daemon started (PID $$) ==="
log "poll interval: ${POLL_INTERVAL}s | branch: $BRANCH"

while true; do
  # Refresh remote refs (best-effort, ignore failures)
  git fetch origin "$BRANCH" >>"$LOG" 2>&1

  # Rebase any remote changes onto local (with autostash)
  git pull --rebase --autostash origin "$BRANCH" >>"$LOG" 2>&1

  # Capture pending changes
  pending=$(git status --porcelain 2>/dev/null)

  if [ -n "$pending" ]; then
    # Stage everything not gitignored
    git add -A >>"$LOG" 2>&1

    summary=$(git diff --cached --stat 2>/dev/null | tail -1)
    timestamp=$(date -Iseconds)

    git commit -m "auto: ${timestamp} — ${summary}" --quiet >>"$LOG" 2>&1

    if git push origin "$BRANCH" >>"$LOG" 2>&1; then
      log "pushed: ${summary}"
    else
      log "ERROR: push failed; will retry next cycle"
    fi
  fi

  sleep "$POLL_INTERVAL"
done
