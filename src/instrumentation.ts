/**
 * Next.js instrumentation hook — runs once when the server starts.
 *
 * We use this to launch the ScanWise auto-push loop INSIDE the long-running
 * `next dev` / `next start` process. The sandbox guarantees the dev server
 * stays alive for the session, so this loop survives too — unlike a separate
 * background shell which gets reaped between bash-tool invocations.
 *
 * Disabled in production by default (set SCANWISE_AUTOPUSH=1 to enable).
 */

export async function register() {
  // Only run on the server (Node.js runtime), not in Edge or the browser.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Skip in production unless explicitly enabled.
  if (process.env.NODE_ENV === "production" && process.env.SCANWISE_AUTOPUSH !== "1") {
    return;
  }

  // Dynamically import so the browser/edge builds never see node-only code.
  const { startAutoPush } = await import("@/lib/autopush");
  startAutoPush();
}
