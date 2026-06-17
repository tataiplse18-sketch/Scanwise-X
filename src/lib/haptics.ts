/**
 * Wraps navigator.vibrate with feature detection + try/catch.
 * Silently no-ops on browsers without vibration support (iOS Safari, desktop).
 */
export function vibrate(pattern: number | number[] = 200): void {
  try {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate !== "function") return;
    navigator.vibrate(pattern);
  } catch {
    // ignore — vibration is best-effort
  }
}
