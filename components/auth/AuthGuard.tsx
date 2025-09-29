// src/components/auth/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isTokenValid } from "@/utils/auth";

const PUBLIC_PATHS = ["/login"]; // เพิ่ม path ที่ไม่ต้องล็อกอินได้ที่นี่

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isPublic) {
      setReady(true);
      return;
    }

    const valid = isTokenValid();
    if (!valid) {
      const next = encodeURIComponent(
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : pathname
      );
      router.replace(`/login?next=${next}`);
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return <div className="p-6 text-sm text-gray-500">กำลังตรวจสอบสิทธิ์…</div>;
  }

  return <>{children}</>;
}
