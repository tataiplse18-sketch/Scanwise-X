/**
 * Plays a short 800Hz beep using the Web Audio API.
 * No external sound file needed — keeps the PWA fully offline-capable.
 *
 * Wrapped in try/catch because some browsers block audio until a user
 * gesture; we never want this to crash the scan flow.
 */
export function playBeep(): void {
  try {
    if (typeof window === "undefined") return;

    const AudioCtxCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtxCtor) return;

    const ctx = new AudioCtxCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 800;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);

    oscillator.onended = () => {
      ctx.close().catch(() => {
        /* ignore */
      });
    };
  } catch {
    // ignore — audio is best-effort
  }
}
