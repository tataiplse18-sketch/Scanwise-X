#!/usr/bin/env bash
# ScanWise auto-push daemon (minimal, robust).
# Polls every 30s. Commits + pushes any pending changes.
# Logs to scripts/autopush.log.

POLL=30
REPO="/home/z/my-project"
LOGF="$REPO/scripts/autopush.log"
LOCK="/tmp/scanwise-autopush-daemon.lock"

cd "$REPO" || exit 1

# ---- single instance via simple lockfile (no flock) ----
if [ -e "$LOCK" ]; then
  OLD=$(cat "$LOCK" 2>/dev/null)
  if [ -n "$OLD" ] && kill -0 "$OLD" 2>/dev/null; then
    echo "$(date -Iseconds) another daemon ($OLD) is alive; exiting" >> "$LOGF"
    exit 0
  fi
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT INT TERM

echo "$(date -Iseconds) === daemon started (PID $$) ===" >> "$LOGF"

while true; do
  git fetch origin main >>"$LOGF" 2>&1
  git pull --rebase --autostash origin main >>"$LOGF" 2>&1

  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    git add -A >>"$LOGF" 2>&1
    summary=$(git diff --cached --stat 2>/dev/null | tail -1)
    ts=$(date -Iseconds)
    git commit -m "auto: ${ts} — ${summary}" --quiet >>"$LOGF" 2>&1
    if git push origin main >>"$LOGF" 2>&1; then
      sha=$(git rev-parse --short HEAD 2>/dev/null)
      echo "$(date -Iseconds) pushed @ ${sha}: ${summary}" >>"$LOGF"
    else
      echo "$(date -Iseconds) ERROR: push failed" >>"$LOGF"
    fi
  fi

  sleep "$POLL"
done
