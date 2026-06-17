export const translations = {
  en: {
    appName: "ScanWise",
    tagline: "Scan karo. Samjho. Sahi khao.",
    scannerPlaceholder: "Scanner coming here",
    scannerSubtitle: "Phase 2 me barcode scanner aayega",
    manualSearch: "Search manually",
    home: "Home",
    scan: "Scan",
    search: "Search",
    history: "History",
    comingSoon: "Coming soon — Phase 2",
    searchPlaceholder: "Product naam type karo...",
    historyEmpty: "Abhi tak koi scan nahi",
  },
  hi: {
    appName: "ScanWise",
    tagline: "स्कैन करो. समझो. सही खाओ.",
    scannerPlaceholder: "स्कैनर यहाँ आएगा",
    scannerSubtitle: "फेज 2 में बारकोड स्कैनर आएगा",
    manualSearch: "मैन्युअल सर्च करो",
    home: "होम",
    scan: "स्कैन",
    search: "सर्च",
    history: "हिस्ट्री",
    comingSoon: "जल्द आ रहा है — फेज 2",
    searchPlaceholder: "प्रोडक्ट नाम टाइप करो...",
    historyEmpty: "अभी तक कोई स्कैन नहीं",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
