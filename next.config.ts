import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  runtimeCaching: [
    {
      // Static assets (JS/CSS chunks) — long-lived cache
      urlPattern: ({ url }) => {
        const isSameOrigin = url.origin === self.location.origin;
        const isChunk = url.pathname.startsWith("/_next/static/");
        return isSameOrigin && isChunk;
      },
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-chunks",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // Google Fonts — Inter via next/font, but cache font files if loaded
      urlPattern: /({)?https?:\/\/fonts\.(?:googleapis|gstatic)\.com\/(.*)/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // PWA icons — cache once
      urlPattern: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.startsWith("/icon"),
      handler: "CacheFirst",
      options: {
        cacheName: "scanwise-icons",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
        },
      },
    },
    {
      // Open Food Facts API (Phase 3) — network-first with cache fallback
      urlPattern: /https?:\/\/(?:world|in)\.openfoodfacts\.org\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "off-api",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
};

export default withPWA(nextConfig);
