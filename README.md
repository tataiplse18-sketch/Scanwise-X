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
| 2.5 | ✅ Done | Cleanup: removed Prisma, auto-push daemon, 30+ unused deps & UI components |
| 3 | ⏳ Next | Open Food Facts API + Supabase caching + product result page |
| 4 | ⏳ | AI summary (Hindi + English) via Gemini |
| 5 | ⏳ | Scan history view refactor |
| 6 | ⏳ | Personalization (allergens, dietary preferences) |
| 7 | ⏳ | Vercel deploy + production hardening |

## Tech Stack

| Layer | Choice |
|-------|--------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 (strict) |
| **Styling** | Tailwind CSS 4 |
| **UI primitives** | shadcn/ui (Button, Input only — slimmed in Phase 2.5) |
| **Icons** | lucide-react |
| **Font** | Inter via `next/font/google` |
| **Barcode scanning** | native `BarcodeDetector` API + `@zxing/browser` fallback |
| **PWA** | `@ducanh2912/next-pwa` (maintained fork of `next-pwa`) |
| **Image processing** | sharp (dev only — for icon generation) |
| **Package manager** | bun (npm also works) |

> **Note on `next-pwa`**: The original `next-pwa` package is abandoned and does not
> support Next.js 13+ App Router. We use [`@ducanh2912/next-pwa`](https://github.com/DuCanhGH/next-pwa)
> which is actively maintained and supports Next.js 13/14/15/16.

## Project Structure

```
scanwise/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Inter font, dark theme, PWA meta, LanguageProvider
│   │   ├── page.tsx            # Mobile shell: Header + active view + BottomNav
│   │   └── globals.css         # ScanWise design tokens, .mobile-container
│   ├── components/
│   │   ├── scanwise/
│   │   │   ├── Header.tsx      # 56px fixed header + logo + LanguageToggle
│   │   │   ├── BottomNav.tsx   # 60px fixed nav, 4 tabs, active=green
│   │   │   ├── LanguageToggle.tsx
│   │   │   ├── HomeView.tsx
│   │   │   ├── ScanView.tsx    # 4-state machine: idle/scanning/detected/error
│   │   │   ├── SearchView.tsx
│   │   │   └── HistoryView.tsx
│   │   └── ui/
│   │       ├── button.tsx      # shadcn-style Button (no asChild — slimmed)
│   │       └── input.tsx       # shadcn-style Input
│   └── lib/
│       ├── translations.ts     # EN + HI strings
│       ├── LanguageContext.tsx # lang + view state, localStorage persistence
│       ├── barcode-scanner.ts  # native BarcodeDetector + ZXing dispatcher
│       ├── sound.ts            # Web Audio API beep (no MP3 file)
│       ├── haptics.ts          # navigator.vibrate wrapper
│       └── utils.ts            # cn() helper (clsx + tailwind-merge)
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icon.svg                # Source SVG logo (green "S")
│   ├── icon-192.png            # PWA icon (auto-generated from SVG)
│   ├── icon-512.png            # PWA icon (auto-generated from SVG)
│   ├── apple-touch-icon.png    # Apple touch icon (auto-generated from SVG)
│   └── robots.txt
├── docs/
│   ├── SCREENSHOTS.md          # Screenshot gallery index
│   └── screenshots/            # 8 PNGs (Phase 1 + Phase 2 states)
├── scripts/
│   └── gen-icons.mjs           # Regenerate PWA PNGs from icon.svg via sharp
├── .env.example                # Phase 3+ env var template
├── .gitignore
├── eslint.config.mjs
├── next.config.ts              # withPWA wrapper + runtime caching rules
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
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
# Install (bun preferred, npm also works)
bun install        # or: npm install

# Dev server
bun run dev        # http://localhost:3000

# Lint
bun run lint

# Production build
bun run build
bun run start

# Regenerate PWA icons from public/icon.svg
bun run icons
```

### Environment setup

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase + Gemini keys (only needed from Phase 3+)
3. Phase 1 + Phase 2 work without any env vars

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

## PWA Details

- **Service worker:** registered via `@ducanh2912/next-pwa`, disabled in dev
- **Runtime caching:**
  - Next.js static chunks → `CacheFirst`, 30 days
  - Google Fonts → `CacheFirst`, 60 days
  - ScanWise icons → `CacheFirst`, 90 days
  - Open Food Facts API → `NetworkFirst` with 5s timeout, 7-day cache (Phase 3 ready)
- **Offline behavior:** app shell loads offline; API calls fail gracefully

## License

Private project. All rights reserved.
