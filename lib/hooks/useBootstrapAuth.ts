// hooks/useBootstrapAuth.ts
"use client";
import { useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const REFRESH_URL = `${API_BASE}/auth/refresh`;

export function useBootstrapAuth() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    let off = false;
    (async () => {
      // hydrate จาก localStorage ให้ UI ขึ้นชื่อ/รูปก่อน
      try {
        const rawUser = localStorage.getItem("user");
        const rawToken = localStorage.getItem("token");
        if (rawUser && rawToken) {
          try {
            setSession(JSON.parse(rawUser), rawToken);
          } catch {}
        }
      } catch {}

      // เรียก refresh (ถ้ามี refresh cookie จะได้ token ใหม่)
      try {
        const r = await axios.post(REFRESH_URL, {}, { withCredentials: true });
        const token = (r as any)?.data?.access_token as string | undefined;
        if (!off && token) {
          setAccessToken(token);
          localStorage.setItem("token", token);
        }
      } catch {
        // ไม่มีคุกกี้/ยังไม่ล็อกอิน → เงียบไว้
      }
    })();
    return () => {
      off = true;
    };
  }, [setAccessToken, setSession]);
}
