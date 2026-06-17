// GET /api/autopush-start
// One-shot endpoint: starts the ScanWise auto-push loop inside the
// currently-running Next.js dev server process. After this is called
// once, the loop polls every 30s and auto-commits + pushes any changes.
//
// Safe to call multiple times — the startAutoPush() function is idempotent.

import { NextResponse } from "next/server";
import { startAutoPush } from "@/lib/autopush";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    startAutoPush();
    return NextResponse.json({
      ok: true,
      message: "autopush loop started (or already running)",
      pid: process.pid,
      pollIntervalMs: 30_000,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
