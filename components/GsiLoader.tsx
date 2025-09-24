"use client";

import Script from "next/script";

export default function GsiLoader() {
  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        window.dispatchEvent(new Event("gsi-loaded"));
      }}
    />
  );
}
