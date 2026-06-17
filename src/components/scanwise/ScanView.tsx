"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Camera,
  Keyboard,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  startScanner,
  queryCameraPermission,
  classifyCameraError,
  type CleanupFn,
} from "@/lib/barcode-scanner";
import { playBeep } from "@/lib/sound";
import { vibrate } from "@/lib/haptics";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ScanState = "idle" | "scanning" | "detected" | "error";

const LAST_BARCODE_KEY = "scanwise-last-barcode";
const HISTORY_KEY = "scanwise-scan-history";
const HISTORY_MAX = 20;
const SCAN_TIMEOUT_MS = 30_000;

// localStorage helpers — safe for SSR + private mode
function readLastBarcode(): string | null {
  try {
    return window.localStorage.getItem(LAST_BARCODE_KEY);
  } catch {
    return null;
  }
}

function writeLastBarcode(code: string): void {
  try {
    window.localStorage.setItem(LAST_BARCODE_KEY, code);
  } catch {
    /* ignore */
  }
}

function pushToHistory(code: string): void {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [code, ...list.filter((c) => c !== code)].slice(
      0,
      HISTORY_MAX
    );
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function ScanView() {
  const { t, setView } = useLanguage();

  const [state, setState] = useState<ScanState>("idle");
  const [detectedCode, setDetectedCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  // Manual entry form state
  const [manualValue, setManualValue] = useState<string>("");
  const [manualError, setManualError] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<CleanupFn | null>(null);

  // ---------------------------------------------------------
  // On mount: check Permissions API. If camera is already
  // denied, we hide the "Start Scanner" button entirely.
  // ---------------------------------------------------------
  useEffect(() => {
    let active = true;
    queryCameraPermission().then((perm) => {
      if (!active) return;
      setPermissionDenied(perm === "denied");
    });
    return () => {
      active = false;
    };
  }, []);

  // ---------------------------------------------------------
  // Camera effect — only runs when state === 'scanning'.
  // Cleans up the camera stream when we leave 'scanning'.
  // ---------------------------------------------------------
  useEffect(() => {
    if (state !== "scanning") return;

    let cancelled = false;
    let attachedCleanup: CleanupFn | null = null;

    // 30-second timeout — no barcode detected
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setErrorMessage(t("errorNoBarcode"));
      setState("error");
    }, SCAN_TIMEOUT_MS);

    const videoEl = videoRef.current;
    // If video element somehow isn't mounted, skip camera start —
    // the user can retry via the cancel button. (Defensive only;
    // videoRef is assigned by React during commit before effects run.)
    if (videoEl) {
      startScanner(
        videoEl,
        (code) => {
          if (cancelled) return;
          playBeep();
          vibrate(200);
          writeLastBarcode(code);
          setDetectedCode(code);
          setState("detected");
        },
        (err) => {
          if (cancelled) return;
          const kind = classifyCameraError(err);
          setErrorMessage(
            kind === "denied"
              ? t("errorCameraDenied")
              : kind === "no_camera"
                ? t("errorNoCamera")
                : t("errorGeneric")
          );
          setState("error");
        }
      ).then((cleanup) => {
        if (cancelled) {
          // We already left 'scanning' — release camera immediately.
          cleanup();
        } else {
          attachedCleanup = cleanup;
          cleanupRef.current = cleanup;
        }
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (attachedCleanup) attachedCleanup();
      cleanupRef.current = null;
    };
  }, [state, t]);

  // ---------------------------------------------------------
  // Final unmount safety net — ensure camera tracks are stopped
  // even if React reuses the component instance.
  // ---------------------------------------------------------
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------
  const handleStartScanner = useCallback(() => {
    setDetectedCode("");
    setErrorMessage("");
    setState("scanning");
  }, []);

  const handleCancelScanning = useCallback(() => {
    setState("idle");
  }, []);

  const handleScanAgain = useCallback(() => {
    setDetectedCode("");
    setState("idle");
  }, []);

  const handleSave = useCallback(() => {
    if (detectedCode) {
      pushToHistory(detectedCode);
    }
    setDetectedCode("");
    setState("idle");
    setView("home");
  }, [detectedCode, setView]);

  const handleManualEntry = useCallback(() => {
    setManualError("");
    setErrorMessage("");
    setDetectedCode("");
    setState("idle");
    // Focus will land on the input via the idle render
  }, []);

  const handleManualSubmit = useCallback(() => {
    const code = manualValue.trim();
    if (!/^\d{8,13}$/.test(code)) {
      setManualError(t("invalidBarcode"));
      return;
    }
    setManualError("");
    setManualValue("");
    writeLastBarcode(code);
    setDetectedCode(code);
    setState("detected");
  }, [manualValue, t]);

  // ---------------------------------------------------------
  // Render — by state
  // ---------------------------------------------------------
  return (
    <div className="flex flex-col px-5 pt-6">
      <h1 className="text-[20px] font-bold text-white">{t("scan")}</h1>

      {state === "idle" && (
        <IdleView
          permissionDenied={permissionDenied}
          manualValue={manualValue}
          manualError={manualError}
          onManualValueChange={setManualValue}
          onManualSubmit={handleManualSubmit}
          onStartScanner={handleStartScanner}
        />
      )}

      {state === "scanning" && (
        <ScanningView onCancel={handleCancelScanning} videoRef={videoRef} />
      )}

      {state === "detected" && (
        <DetectedView
          code={detectedCode}
          onScanAgain={handleScanAgain}
          onSave={handleSave}
        />
      )}

      {state === "error" && (
        <ErrorView
          message={errorMessage}
          onTryAgain={handleStartScanner}
          onManualEntry={handleManualEntry}
        />
      )}
    </div>
  );
}

// =========================================================
// IDLE — Start Scanner button + manual entry
// =========================================================
interface IdleViewProps {
  permissionDenied: boolean;
  manualValue: string;
  manualError: string;
  onManualValueChange: (v: string) => void;
  onManualSubmit: () => void;
  onStartScanner: () => void;
}

function IdleView({
  permissionDenied,
  manualValue,
  manualError,
  onManualValueChange,
  onManualSubmit,
  onStartScanner,
}: IdleViewProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-5 flex flex-col">
      {!permissionDenied ? (
        <>
          <button
            type="button"
            onClick={onStartScanner}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] text-[16px] font-semibold text-white shadow-lg shadow-[#16a34a]/20 transition-transform active:scale-[0.98]"
          >
            <ScanLine size={22} />
            {t("startScanner")}
          </button>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#888]">
            <Camera size={13} className="shrink-0" />
            {t("scannerHelper")}
          </p>
        </>
      ) : (
        <div className="rounded-xl border border-[#222] bg-[#111] p-3">
          <p className="flex items-center gap-2 text-[12px] text-[#f59e0b]">
            <Camera size={14} className="shrink-0" />
            {t("manualEntryOnly")}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#222]" />
        <span className="text-[12px] font-medium text-[#666]">
          {t("orDivider")}
        </span>
        <div className="h-px flex-1 bg-[#222]" />
      </div>

      {/* Manual entry */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Keyboard size={14} className="text-[#666]" />
          <span className="text-[13px] font-medium text-[#aaa]">
            {t("manualEntry")}
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={13}
            value={manualValue}
            onChange={(e) =>
              onManualValueChange(e.target.value.replace(/\D/g, ""))
            }
            placeholder={t("manualEntryPlaceholder")}
            className="h-11 flex-1 rounded-xl border-[#222] bg-[#111] px-3 text-[15px] text-white placeholder:text-[#666] focus-visible:border-[#16a34a] focus-visible:ring-[#16a34a]/30"
            aria-label={t("manualEntryPlaceholder")}
          />
          <button
            type="button"
            onClick={onManualSubmit}
            className="h-11 shrink-0 rounded-xl border border-[#16a34a] bg-transparent px-4 text-[14px] font-semibold text-[#16a34a] transition-colors active:bg-[#16a34a]/10"
          >
            {t("submit")}
          </button>
        </div>
        {manualError && (
          <p className="text-[12px] text-[#ef4444]">{manualError}</p>
        )}
      </div>
    </div>
  );
}

// =========================================================
// SCANNING — live camera viewfinder
// =========================================================
interface ScanningViewProps {
  onCancel: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

function ScanningView({ onCancel, videoRef }: ScanningViewProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-5 flex flex-col">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#16a34a] bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {/* Scan line overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-0.5 w-3/4 animate-pulse bg-[#16a34a] shadow-[0_0_12px_#16a34a]" />
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1 text-[14px] font-medium text-white">
        {t("scanning")}
        <span className="inline-flex">
          <span className="animate-bounce [animation-delay:-0.3s]">.</span>
          <span className="animate-bounce [animation-delay:-0.15s]">.</span>
          <span className="animate-bounce">.</span>
        </span>
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#ef4444]/50 bg-transparent text-[14px] font-semibold text-[#ef4444] transition-colors active:bg-[#ef4444]/10"
      >
        <X size={16} />
        {t("cancel")}
      </button>
    </div>
  );
}

// =========================================================
// DETECTED — show barcode + Scan Again / Save
// =========================================================
interface DetectedViewProps {
  code: string;
  onScanAgain: () => void;
  onSave: () => void;
}

function DetectedView({ code, onScanAgain, onSave }: DetectedViewProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-6 flex flex-col items-center">
      <CheckCircle2 size={64} className="text-[#16a34a]" />
      <h2 className="mt-4 text-[18px] font-bold text-white">
        {t("barcodeDetected")}
      </h2>

      <div className="mt-4 w-full rounded-xl bg-[#111] p-4 text-center">
        <p className="text-[11px] uppercase tracking-wider text-[#666]">
          Barcode
        </p>
        <p className="mt-1 break-all font-mono text-[24px] font-semibold text-white">
          {code}
        </p>
      </div>

      <p className="mt-3 text-center text-[12px] text-[#888]">
        {t("phase3Note")}
      </p>

      <div className="mt-5 flex w-full gap-3">
        <button
          type="button"
          onClick={onScanAgain}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#16a34a] bg-transparent text-[14px] font-semibold text-[#16a34a] transition-colors active:bg-[#16a34a]/10"
        >
          <RefreshCw size={16} />
          {t("scanAgain")}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#16a34a] text-[14px] font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <Save size={16} />
          {t("save")}
        </button>
      </div>
    </div>
  );
}

// =========================================================
// ERROR — friendly message + escape hatches
// =========================================================
interface ErrorViewProps {
  message: string;
  onTryAgain: () => void;
  onManualEntry: () => void;
}

function ErrorView({ message, onTryAgain, onManualEntry }: ErrorViewProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-8 flex flex-col items-center">
      <XCircle size={64} className="text-[#ef4444]" />
      <p className="mt-4 max-w-[280px] text-center text-[14px] text-[#ccc]">
        {message}
      </p>

      <div className="mt-6 flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={onTryAgain}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-colors",
            "border border-[#16a34a] bg-transparent text-[#16a34a] active:bg-[#16a34a]/10"
          )}
        >
          <RefreshCw size={16} />
          {t("tryAgain")}
        </button>
        <button
          type="button"
          onClick={onManualEntry}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] text-[14px] font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <Keyboard size={16} />
          {t("manualEntry")}
        </button>
      </div>
    </div>
  );
}
