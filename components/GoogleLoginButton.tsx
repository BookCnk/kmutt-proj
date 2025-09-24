"use client";
import * as React from "react";
import api from "@/lib/api";

declare global {
  interface Window {
    google?: any;
  }
}

type LoginResponse = {
  status: boolean;
  message: string;
  access_token: string;
  data: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    role: string;
  };
};

export default function GoogleLoginButton({ onDone }: { onDone?: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  const googleBtnContainerRef = React.useRef<HTMLDivElement>(null);

  const initGsi = React.useCallback(() => {
    if (
      !window.google?.accounts?.id ||
      !clientId ||
      !googleBtnContainerRef.current
    )
      return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: any) => {
        try {
          const idToken = resp?.credential as string;
          if (!idToken) throw new Error("ไม่พบ ID Token");
          setLoading(true);

          const r = await api.post<LoginResponse, LoginResponse>(
            "/auth/google",
            {
              token: idToken,
            }
          );

          localStorage.setItem("token", r.access_token);
          localStorage.setItem("user", JSON.stringify(r.data));

          onDone?.();
        } catch (e: any) {
          console.error(e);
          setErr(e?.message || "ล็อกอินไม่สำเร็จ");
        } finally {
          setLoading(false);
        }
      },
      ux_mode: "popup",
      auto_select: false,
      itp_support: true,
      use_fedcm_for_prompt: true,
    });

    window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 320,
    });
  }, [clientId]);

  React.useEffect(() => {
    if (window.google?.accounts?.id) {
      initGsi();
      return;
    }
    const onLoaded = () => initGsi();
    window.addEventListener("gsi-loaded", onLoaded);
    return () => window.removeEventListener("gsi-loaded", onLoaded);
  }, [initGsi]);

  const openPopup = () => {
    setErr(null);
    const realBtn = googleBtnContainerRef.current?.querySelector(
      "div[role=button]"
    ) as HTMLDivElement | null;
    if (!realBtn) {
      setErr("ยังโหลดสคริปต์ Google ไม่เสร็จ");
      return;
    }
    realBtn.click();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openPopup}
        disabled={loading}
        className="group relative mx-auto grid h-14 w-64 place-items-center rounded-full border border-black/10 bg-white/90 text-zinc-800 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-[0.98] dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-100 sm:w-80 md:w-96">
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}
      </button>

      <div aria-hidden className="sr-only">
        <div ref={googleBtnContainerRef} />
      </div>

      {err && <p className="text-center text-sm text-red-600">{err}</p>}
    </div>
  );
}
