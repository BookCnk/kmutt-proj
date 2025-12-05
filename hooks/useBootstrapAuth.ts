"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { decodeJwt } from "@/lib/authz";

export function useBootstrapAuth() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

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
        if (!cancelled && r?.access_token) {
          localStorage.setItem("token", r.access_token);

          // Update user data from refresh response or decode from JWT
          if (r?.data) {
            localStorage.setItem("user", JSON.stringify(r.data));
            setSession(r.data, r.access_token);
          } else {
            // Decode user info from JWT if not provided in response
            const payload = decodeJwt(r.access_token);
            if (payload) {
              const user = {
                id: payload.id || payload.sub || "",
                email: payload.email || "",
                name: payload.name,
                picture: payload.picture,
                role: payload.role,
              };
              localStorage.setItem("user", JSON.stringify(user));
              setSession(user, r.access_token);
            } else {
              setAccessToken(r.access_token);
            }
          }
        }
      } catch {
        // Not logged in - do nothing
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAccessToken, setSession]);

  return { isBootstrapping };
}
