"use client";

import { ScanLine, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export function ScanView() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center px-5 pt-6">
      <div
        className="mt-6 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#16a34a]/60"
        style={{ height: "46vh", minHeight: 260 }}
      >
        <ScanLine size={56} className="text-[#16a34a]" />
        <p className="mt-4 text-[16px] font-medium text-white">
          {t("scannerPlaceholder")}
        </p>
        <p className="mt-1 text-center text-[12px] text-[#888]">
          {t("scannerSubtitle")}
        </p>
      </div>

      <div className="mt-6 w-full rounded-xl border border-[#222] bg-[#111] p-4">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 text-[#16a34a]" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">
              {t("comingSoon")}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#888]">
              Phase 2 me camera se barcode scan hoga, fir product ki poori
              jaankari Hindi ya English me milegi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
