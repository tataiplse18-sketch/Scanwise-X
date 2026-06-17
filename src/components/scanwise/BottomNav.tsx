"use client";

import { Home, ScanLine, Search, History } from "lucide-react";
import { useLanguage, type ViewKey } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

type Tab = {
  view: ViewKey;
  labelKey: "home" | "scan" | "search" | "history";
  Icon: React.ComponentType<{ className?: string; size?: number }>;
};

const TABS: Tab[] = [
  { view: "home", labelKey: "home", Icon: Home },
  { view: "scan", labelKey: "scan", Icon: ScanLine },
  { view: "search", labelKey: "search", Icon: Search },
  { view: "history", labelKey: "history", Icon: History },
];

export function BottomNav() {
  const { view, setView, t } = useLanguage();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[430px] items-stretch border-t border-[#222] bg-[#0a0a0a]"
      style={{ height: "calc(60px + env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      {TABS.map(({ view: tabView, labelKey, Icon }) => {
        const active = view === tabView;
        return (
          <button
            key={tabView}
            type="button"
            onClick={() => setView(tabView)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
              active ? "text-[#16a34a]" : "text-[#666]"
            )}
          >
            <Icon size={24} className="shrink-0" />
            <span className="text-[12px] font-medium leading-none">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
