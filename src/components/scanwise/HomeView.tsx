"use client";

import { ScanLine, Search as SearchIcon } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export function HomeView() {
  const { t, setView } = useLanguage();

  return (
    <div className="flex flex-col items-center px-5 pt-6">
      {/* Tagline */}
      <p
        className="mt-6 text-center text-[14px] text-[#888]"
        style={{ marginTop: "24px" }}
      >
        {t("tagline")}
      </p>

      {/* Scanner placeholder dashed box */}
      <div
        className="mt-6 flex w-[90%] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#16a34a]"
        style={{ height: "50vh", minHeight: 280 }}
      >
        <ScanLine size={48} className="text-[#16a34a]" />
        <p className="mt-4 text-center text-[16px] font-medium text-white">
          {t("scannerPlaceholder")}
        </p>
        <p className="mt-1 text-center text-[12px] text-[#888]">
          {t("scannerSubtitle")}
        </p>
      </div>

      {/* Manual search link */}
      <button
        type="button"
        onClick={() => setView("search")}
        className="mt-4 text-[14px] font-medium text-[#16a34a] underline underline-offset-4"
        style={{ marginTop: "16px" }}
      >
        {t("manualSearch")}
      </button>

      {/* Phase hint card */}
      <div className="mt-8 w-full rounded-xl border border-[#222] bg-[#111] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#16a34a]/15">
            <SearchIcon size={18} className="text-[#16a34a]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white">
              Phase 1 · Skeleton Ready
            </p>
            <p className="truncate text-[12px] text-[#888]">
              {t("comingSoon")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
