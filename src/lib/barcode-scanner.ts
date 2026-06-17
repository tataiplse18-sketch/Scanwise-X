import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

// =========================================================
// Types
// =========================================================

/**
 * Minimal structural type for the native BarcodeDetector API
 * (not yet in TypeScript's standard DOM lib as a stable type).
 */
type BarcodeDetectorInstance = {
  detect: (
    source: CanvasImageSource
  ) => Promise<
    Array<{ rawValue: string; format: string; boundingBox: DOMRectReadOnly }>
  >;
};

type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

type DetectedHandler = (code: string) => void;
type ErrorHandler = (err: Error) => void;
export type CleanupFn = () => void;

// =========================================================
// Constants
// =========================================================

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

const SCAN_INTERVAL_MS = 100;
const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];
const ZXING_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
];

// =========================================================
// Feature detection
// =========================================================

function getNativeBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
  return w.BarcodeDetector ?? null;
}

/**
 * Returns true only if the native BarcodeDetector API is both
 * present AND constructible (some browsers expose it but throw).
 */
export async function isBarcodeDetectorSupported(): Promise<boolean> {
  const ctor = getNativeBarcodeDetectorCtor();
  if (!ctor) return false;
  try {
    new ctor();
    return true;
  } catch {
    return false;
  }
}

// =========================================================
// Native scanner (BarcodeDetector API)
// =========================================================

export async function startNativeScanner(
  video: HTMLVideoElement,
  onDetected: DetectedHandler,
  onError: ErrorHandler
): Promise<CleanupFn> {
  const ctor = getNativeBarcodeDetectorCtor();
  if (!ctor) {
    onError(new Error("BarcodeDetector API not supported"));
    return () => {};
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
  } catch (err) {
    onError(
      err instanceof Error ? err : new Error("Camera access failed")
    );
    return () => {};
  }

  video.srcObject = stream;
  video.setAttribute("playsinline", "true");
  video.muted = true;
  try {
    await video.play();
  } catch {
    // Some browsers reject play() outside a user gesture —
    // detection may still work because we own the stream.
  }

  const detector = new ctor({ formats: NATIVE_FORMATS });
  let stopped = false;

  const intervalId = window.setInterval(async () => {
    if (stopped) return;
    try {
      const barcodes = await detector.detect(video);
      if (stopped) return;
      if (barcodes.length > 0 && barcodes[0]?.rawValue) {
        stopped = true;
        onDetected(barcodes[0].rawValue);
      }
    } catch {
      // ignore per-tick detection errors — keep trying
    }
  }, SCAN_INTERVAL_MS);

  return () => {
    stopped = true;
    window.clearInterval(intervalId);
    stream.getTracks().forEach((track) => track.stop());
    if (video.srcObject === stream) {
      video.srcObject = null;
    }
  };
}

// =========================================================
// ZXing fallback scanner
// =========================================================

export async function startZXingScanner(
  video: HTMLVideoElement,
  onDetected: DetectedHandler,
  onError: ErrorHandler
): Promise<CleanupFn> {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS);

  const reader = new BrowserMultiFormatReader(hints);

  let controls: IScannerControls | null = null;
  let stopped = false;

  try {
    controls = await reader.decodeFromConstraints(
      CAMERA_CONSTRAINTS,
      video,
      (result, err) => {
        if (stopped) return;
        // ZXing throws NotFoundException every frame without a code — ignore err.
        if (result) {
          const text = result.getText();
          if (text) {
            stopped = true;
            onDetected(text);
          }
        }
      }
    );
  } catch (err) {
    onError(
      err instanceof Error ? err : new Error("ZXing scanner failed to start")
    );
    return () => {};
  }

  return () => {
    stopped = true;
    try {
      controls?.stop();
    } catch {
      // ignore — best-effort cleanup
    }
  };
}

// =========================================================
// Dispatcher — prefer native, fall back to ZXing
// =========================================================

export async function startScanner(
  video: HTMLVideoElement,
  onDetected: DetectedHandler,
  onError: ErrorHandler
): Promise<CleanupFn> {
  const useNative = await isBarcodeDetectorSupported();
  if (useNative) {
    try {
      return await startNativeScanner(video, onDetected, onError);
    } catch {
      // fall through to ZXing
    }
  }
  return startZXingScanner(video, onDetected, onError);
}

// =========================================================
// Permissions API helper
// =========================================================

export type CameraPermissionState = "granted" | "denied" | "prompt" | "unknown";

/**
 * Queries the Permissions API for the current camera permission state.
 * Returns "unknown" if the Permissions API doesn't support "camera"
 * (e.g. older Safari).
 */
export async function queryCameraPermission(): Promise<CameraPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions) {
    return "unknown";
  }
  try {
    // `name: 'camera'` is not yet in TS's PermissionName union on all versions,
    // so cast narrowly.
    const status = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });
    return status.state as CameraPermissionState;
  } catch {
    return "unknown";
  }
}

// =========================================================
// Error classification — used by UI to pick the right message
// =========================================================

export type CameraErrorKind =
  | "denied"
  | "no_camera"
  | "generic";

export function classifyCameraError(err: Error): CameraErrorKind {
  const name = err.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (
    name === "NotFoundError" ||
    name === "OverconstrainedError" ||
    name === "DevicesNotFoundError"
  ) {
    return "no_camera";
  }
  return "generic";
}
