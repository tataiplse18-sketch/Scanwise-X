# ScanWise Screenshots

All screenshots were captured via Agent Browser at **430 × 932 viewport** (mobile-first)
during the Phase 1 and Phase 2 verification cycles. They demonstrate the actual
rendered UI of the live preview — not mockups.

## Phase 1 — Skeleton (4 views + language toggle + PWA)

| File | View | Language | What it shows |
|------|------|----------|---------------|
| `scanwise-home-en.png` | Home | English | Tagline + dashed scanner placeholder + "Search manually" link |
| `scanwise-home-hi.png` | Home | Hindi | Same view, fully translated to Hindi (स्कैनर यहाँ आएगा, etc.) |
| `scanwise-scan-hi.png` | Scan | Hindi | Phase 1 placeholder before Phase 2 scanner was built |
| `scanwise-search-hi.png` | Search | Hindi | Non-functional search input (Phase 3 will wire it up) |
| `scanwise-history-hi.png` | History | Hindi | Empty state — "अभी तक कोई स्कैन नहीं" |

## Phase 2 — Barcode Scanner (4-state machine)

| File | State | What it shows |
|------|-------|---------------|
| `scanwise-phase2-scan-idle.png` | `idle` | Green "Start Scanner" button + "OR" divider + manual 8-13 digit entry input + Submit |
| `scanwise-phase2-scan-detected.png` | `detected` | Green check icon + "Barcode mil gaya!" + monospace barcode number + Scan Again / Save buttons |
| `scanwise-phase2-scan-invalid.png` | `idle` (with error) | Manual entry validation error — "8-13 digit ka barcode daalo" shown in red below input |

## Capturing new screenshots

If you want to regenerate any of these (e.g. after a UI change), run:

```bash
# Install Agent Browser (one-time)
npm install -g agent-browser && agent-browser install

# Capture
agent-browser set viewport 430 932
agent-browser open https://preview-<bot-id>.space-z.ai/
agent-browser eval "document.querySelector('nextjs-portal')?.remove()"  # dismiss dev overlay
agent-browser screenshot docs/screenshots/scanwise-home-en.png
```

To switch language before capturing, click the "HI" / "EN" toggle in the header.
