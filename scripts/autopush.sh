#!/usr/bin/env bash
# ScanWise auto-push daemon
# Polls the working tree every 30s. If anything changed (and the change is
# NOT inside sandbox-only paths), it commits with a timestamped message and
# pushes to origin/main.
#
# Logs to /home/z/my-project/scripts/autopush.log
#
# Safety:
#   - Never commits .env, node_modules/, .next/, dev.log
#   - Never commits anything inside download/, upload/, .zscripts/, db/,
#     examples/, mini-services/, Caddyfile (all gitignored)
#   - On push failure (network / auth), logs and retries next cycle
#   - Single-instance: exits if another autopush is already running

set -u

REPO="/home/z/my-project"
LOG="/home/z/my-project/scripts/autopush.log"
POLL_INTERVAL=30  # seconds
BRANCH="main"

cd "$REPO" || exit 1

# ---- Single-instance guard ----------------------------------------------
LOCKFILE="/tmp/scanwise-autopush.lock"
exec 9>"$LOCKFILE"
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
  # Refresh remote-tracking refs (cheap, ignores failures silently)
  git fetch origin "$BRANCH" >/dev/null 2>&1

  # 1. Pull any remote changes first (rebase keeps history linear)
  if ! git pull --rebase --autostash origin "$BRANCH" >/dev/null 2>&1; then
    log "WARN: pull --rebase failed; will retry next cycle"
    sleep "$POLL_INTERVAL"
    continue
  fi

  # 2. Check for any staged/unstaged changes (excluding ignored files)
  if [ -n "$(git status --porcelain)" ]; then
    # Stage everything that isn't gitignored
    git add -A

    # Build a short summary of what changed
    summary=$(git diff --cached --stat | tail -1)
    timestamp=$(date -Iseconds)

    # Commit
    if git commit -m "auto: ${timestamp} — ${summary}" --quiet; then
      log "committed: ${summary}"
    else
      log "INFO: nothing to commit (likely already clean)"
    fi

    # Push
    if git push origin "$BRANCH" >/dev/null 2>&1; then
      log "pushed to origin/$BRANCH @ $(git rev-parse --short HEAD)"
    else
      log "ERROR: push failed; will retry next cycle"
    fi
  fi

  sleep "$POLL_INTERVAL"
done
