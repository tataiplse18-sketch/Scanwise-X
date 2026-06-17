# ScanWise

> Scan karo. Samjho. Sahi khao.
> AI-powered food barcode scanner for Indian users — bilingual (Hindi + English), mobile-first PWA.

![ScanWise](public/icon.svg)

> 📸 **Screenshots** — see [`docs/SCREENSHOTS.md`](docs/SCREENSHOTS.md) for a full gallery
> of Phase 1 (4 views) and Phase 2 (scanner states) captures at 430×932 mobile viewport.

## Status

| Phase | Status | What |
|-------|--------|------|
| 1 | ✅ Done | Skeleton: 4 views, dark theme, EN/HI toggle, PWA setup |
| 2 | ✅ Done | Real barcode scanner (native BarcodeDetector + ZXing fallback) |
| 3 | ⏳ Next | Open Food Facts API + Supabase caching |
| 4 | ⏳ | Product result page with nutrition breakdown |
| 5 | ⏳ | AI summary (Hindi + English) |
| 6 | ⏳ | Scan history view refactor |
| 7 | ⏳ | Personalization (allergens, dietary preferences) |
| 8 | ⏳ | Vercel deploy + production hardening |

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5** (strict)
- **Tailwind CSS 4** + shadcn/ui (New York style)
- **@zxing/browser** + **@zxing/library** (barcode scanning)
- **lucide-react** (icons)
- **Inter** font (next/font/google)
- PWA-ready: manifest.json + 192/512 PNG icons + SVG

## Architecture

The sandbox preview only exposes the `/` route, so the app is built as a
single-page mobile shell with client-side view switching (home / scan /
search / history) driven by `LanguageContext`. The components are isolated
per view, so splitting into real `/scan`, `/search`, `/history` routes for
production is a 10-minute refactor.

```
src/
├── app/
│   ├── layout.tsx          # Inter font, dark theme, PWA meta, LanguageProvider
│   ├── page.tsx            # Mobile shell: Header + active view + BottomNav
│   └── globals.css         # ScanWise design tokens, .mobile-container
├── components/
│   ├── scanwise/
│   │   ├── Header.tsx      # 56px fixed header + logo + LanguageToggle
│   │   ├── BottomNav.tsx   # 60px fixed nav, 4 tabs, active=green
│   │   ├── LanguageToggle.tsx
│   │   ├── HomeView.tsx
│   │   ├── ScanView.tsx    # 4-state machine: idle/scanning/detected/error
│   │   ├── SearchView.tsx
│   │   └── HistoryView.tsx
│   └── ui/                 # shadcn/ui primitives (Button, Input, Card, ...)
└── lib/
    ├── translations.ts     # EN + HI strings
    ├── LanguageContext.tsx # lang + view state, localStorage persistence
    ├── barcode-scanner.ts  # native BarcodeDetector + ZXing dispatcher
    ├── sound.ts            # Web Audio API beep (no MP3 file)
    ├── haptics.ts          # navigator.vibrate wrapper
    └── utils.ts            # cn() helper
```

## Design System

| Token | Value |
|-------|-------|
| Background | `#050505` |
| Card | `#111111` |
| Border | `#222222` |
| Primary (green) | `#16A34A` |
| Text primary | `#FFFFFF` |
| Text secondary | `#888888` |
| Mobile width | `430px` (centered with side borders) |
| Header height | `56px` |
| Bottom nav height | `60px` |

## Development

```bash
bun install
bun run dev       # http://localhost:3000
bun run lint
bun run build
```

### Regenerate PWA icons

```bash
bun run scripts/gen-icons.mjs
```

Reads `public/icon.svg` and writes `icon-192.png`, `icon-512.png`, and
`apple-touch-icon.png` via `sharp`.

## Scanner Details

- **Format support:** EAN-13, EAN-8, UPC-A, UPC-E
- **Strategy:** Try native `BarcodeDetector` API first (Chrome 83+), fall
  back to `@zxing/browser` if not available or if it throws.
- **Camera:** `getUserMedia({ video: { facingMode: { ideal: 'environment' } } })`
- **Cleanup:** Camera stream tracks are stopped on state change, tab switch,
  and component unmount (verified via `cleanupRef` + dual-effect pattern).
- **Permission flow:** `navigator.permissions.query({ name: 'camera' })` is
  checked on mount. If already denied, the "Start Scanner" button is hidden
  and only manual entry is shown.
- **Feedback on detect:** Web Audio API 800Hz beep + `navigator.vibrate(200)`.
- **Timeout:** 30 seconds → friendly "no barcode found" message.
- **Manual entry:** 8-13 digit numeric input with regex validation.

## License

Private project. All rights reserved.
