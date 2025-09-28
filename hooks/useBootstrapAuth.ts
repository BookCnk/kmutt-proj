"use client";
import { useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export function useBootstrapAuth() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    (async () => {
      // Hydrate user data from localStorage for immediate UI update
      try {
        const user = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (user && token) setSession(JSON.parse(user), token);
      } catch {}

      // Try to get new token from refresh cookie
      try {
        const r: any = await api.post("/auth/refresh");
        if (r?.access_token) {
          localStorage.setItem("token", r.access_token);
          setAccessToken(r.access_token);
        }
      } catch {
        // Not logged in - do nothing
      }
    })();
  }, [setAccessToken, setSession]);
}
