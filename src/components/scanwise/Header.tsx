"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
  const { t } = useLanguage();

  return (
    <header
      className="safe-top fixed inset-x-0 top-0 z-40 mx-auto flex h-14 max-w-[430px] items-center justify-between border-b border-[#222] bg-[#0a0a0a] px-4"
      style={{ height: "calc(56px + env(safe-area-inset-top))" }}
    >
      <div className="flex items-center gap-2">
        {/* small logo mark */}
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#16a34a]">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <span
          className="text-xl font-bold text-[#16a34a]"
          style={{ letterSpacing: "-0.02em" }}
        >
          {t("appName")}
        </span>
      </div>
      <LanguageToggle />
    </header>
  );
}
