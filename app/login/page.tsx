// src/app/login/page.tsx
"use client";
import GoogleOneTap from "@/components/GoogleOneTap";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard/overview";

  // ถ้ามี token และยังไม่หมดอายุ อยู่แล้วให้เด้งเข้าหน้าถัดไปเลย
  useEffect(() => {
    if (isTokenValid()) {
      router.replace(next);
    }
  }, [router, next]);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      {/* โหลดสคริปต์ Google GSI */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        async
        defer
        onLoad={() => {
          // แจ้งให้ปุ่มรู้ว่า gsi พร้อมแล้ว
          window.dispatchEvent(new Event("gsi-loaded"));
        }}
      />

      <div className="w-full max-w-md rounded-2xl border p-8 backdrop-blur bg-white/70">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-sm opacity-80 mb-6">
          คลิกปุ่มด้านล่างเพื่อดำเนินการต่อ
        </p>
        <GoogleOneTap
          onDone={() => router.replace("/dashboard/overview")}
        />
      </div>
    </main>
  );
}
