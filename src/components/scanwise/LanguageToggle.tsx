"use client";

import { useLanguage } from "@/lib/LanguageContext";
import type { Language } from "@/lib/translations";
import { cn } from "@/lib/utils";

const SEGMENTS: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "hi", label: "HI" },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="tablist"
      aria-label="Language selector"
      className="inline-flex h-8 w-[88px] items-center rounded-md border border-[#222] bg-[#0a0a0a] p-0.5"
    >
      {SEGMENTS.map((seg) => {
        const active = lang === seg.value;
        return (
          <button
            key={seg.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => setLang(seg.value)}
            className={cn(
              "flex h-7 flex-1 items-center justify-center rounded-[5px] text-xs font-semibold transition-colors",
              active
                ? "bg-[#16a34a] text-white"
                : "bg-transparent text-[#666] hover:text-[#aaa]"
            )}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
