// app/login/page.tsx
"use client";
import GoogleOneTap from "@/components/GoogleOneTap";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = search?.get("next") || "/dashboard/overview";

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-sm opacity-80 mb-6">
          คลิกปุ่มด้านล่างเพื่อดำเนินการต่อ
        </p>
        <div id="google-signin-host" className="flex justify-center" />
        <GoogleOneTap
          onSuccess={(_res) => router.replace("/dashboard/overview")}
          autoPrompt={false}
          showButton
          buttonContainerId="google-signin-host"
          debug
        />
      </div>
    </main>
  );
}
