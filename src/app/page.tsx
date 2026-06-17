"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { Header } from "@/components/scanwise/Header";
import { BottomNav } from "@/components/scanwise/BottomNav";
import { HomeView } from "@/components/scanwise/HomeView";
import { ScanView } from "@/components/scanwise/ScanView";
import { SearchView } from "@/components/scanwise/SearchView";
import { HistoryView } from "@/components/scanwise/HistoryView";

export default function Page() {
  const { view } = useLanguage();

  return (
    <div className="mobile-container">
      <Header />

      {/* Main scrollable content — padded for fixed header (56px) + fixed bottom nav (60px) */}
      <main
        className="scroll-hide overflow-y-auto px-0 pb-[80px] pt-[56px]"
        style={{
          paddingTop: "calc(56px + env(safe-area-inset-top))",
          paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
          minHeight: "100vh",
        }}
      >
        {view === "home" && <HomeView />}
        {view === "scan" && <ScanView />}
        {view === "search" && <SearchView />}
        {view === "history" && <HistoryView />}
      </main>

      <BottomNav />
    </div>
  );
}
