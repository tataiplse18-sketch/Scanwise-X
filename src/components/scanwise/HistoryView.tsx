"use client";

import { History as HistoryIcon } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export function HistoryView() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col px-5 pt-6">
      <h1 className="text-[20px] font-bold text-white">{t("history")}</h1>
      <p className="mt-1 text-[13px] text-[#888]">{t("comingSoon")}</p>

      {/* Empty state */}
      <div
        className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-[#222] bg-[#111] py-12 text-center"
        style={{ minHeight: 240 }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16a34a]/10">
          <HistoryIcon size={24} className="text-[#16a34a]" />
        </div>
        <p className="mt-4 text-[14px] font-medium text-white">
          {t("historyEmpty")}
        </p>
        <p className="mt-1 px-6 text-[12px] text-[#888]">
          Phase 4 me scanned products yahan list honge — sabhi nutrition
          details ke saath.
        </p>
      </div>
    </div>
  );
}
