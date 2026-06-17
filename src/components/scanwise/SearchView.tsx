"use client";

import { Search as SearchIcon } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Input } from "@/components/ui/input";

export function SearchView() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col px-5 pt-6">
      <h1 className="text-[20px] font-bold text-white">{t("search")}</h1>
      <p className="mt-1 text-[13px] text-[#888]">{t("comingSoon")}</p>

      <div className="relative mt-5">
        <SearchIcon
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#666]"
        />
        <Input
          type="text"
          inputMode="search"
          placeholder={t("searchPlaceholder")}
          className="h-11 rounded-xl border-[#222] bg-[#111] pl-10 pr-3 text-[15px] text-white placeholder:text-[#666] focus-visible:border-[#16a34a] focus-visible:ring-[#16a34a]/30"
          // Non-functional in Phase 1 — read-only to signal "coming soon"
          readOnly
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <div className="mt-6 rounded-xl border border-[#222] bg-[#111] p-4">
        <p className="text-[12px] leading-relaxed text-[#888]">
          Phase 3 me is search box se 10 lakh+ Indian food products search
          honge. Abhi ye sirf UI dikha raha hai.
        </p>
      </div>
    </div>
  );
}
