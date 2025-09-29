"use client";

import * as React from "react";
import api from "@/lib/api";

// ---------- Types ----------
type GoogleCredentialResponse = {
  credential: string;
  select_by: string;
  clientId?: string;
};

type LoginResponse = {
  status: boolean;
  message: string;
  access_token?: string; // optional if your backend sets httpOnly cookie
  data?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    role?: string;
  };
};

type GoogleOneTapProps = {
  /** Called after backend login succeeds */
  onSuccess?: (payload: LoginResponse) => void;
  /** Called on any recoverable error */
  onError?: (error: string) => void;
  /** Show One Tap automatically */
  autoPrompt?: boolean;
  /** Also render a classic Google button as a fallback */
  showButton?: boolean;
  /** Enable/disable the whole widget without unmounting */
  enabled?: boolean;
  /** Override backend path (default: /auth/google) */
  loginPath?: string;
  /** Useful during integration */
  debug?: boolean;
  /** Optional DOM id to host the classic button */
  buttonContainerId?: string;
};

declare global {
  interface Window {
    google?: any;
  }
}

// ---------- Component ----------
export default function GoogleOneTap({
  onSuccess,
  onError,
  autoPrompt = true,
  showButton = false,
  enabled = true,
  loginPath = "/auth/google",
  debug = false,
  buttonContainerId = "google-btn-container",
}: GoogleOneTapProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const hasInitialized = React.useRef(false);
  const hasPrompted = React.useRef(false);
  const mounted = React.useRef(true);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Ensure cleanup flags
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Best-effort cancel
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const report = React.useCallback(
    (msg: string, err?: unknown) => {
      if (debug) {
        // eslint-disable-next-line no-console
        console.warn(`[GoogleOneTap] ${msg}`, err ?? "");
      }
      setError(msg);
      onError?.(msg);
    },
    [debug, onError]
  );

  const handleCredentialResponse = React.useCallback(
    async (response: GoogleCredentialResponse) => {
      if (isProcessing) return;
      if (!response?.credential) {
        report("Missing ID token from Google.");
        return;
      }

      try {
        setIsProcessing(true);
        setError(null);

        // Send token to your backend (ideally backend sets httpOnly cookies)
        const result = await api.post<LoginResponse, LoginResponse>(loginPath, {
          token: response.credential,
        });

        if (!result?.status) {
          throw new Error(result?.message || "Login failed");
        }

        // If your backend returns an access token (not recommended for long-term storage),
        // you can still store it. Prefer httpOnly cookie on the server.
        if (result.access_token) {
          localStorage.setItem("token", result.access_token);
        }
        if (result.data) {
          localStorage.setItem("user", JSON.stringify(result.data));
        }

        onSuccess?.(result);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Login failed. Please try again.";
        report(message, err);
      } finally {
        if (mounted.current) setIsProcessing(false);
      }
    },
    [isProcessing, loginPath, onSuccess, report]
  );

  // Load GSI script (idempotent)
  const loadGsiScript = React.useCallback(async () => {
    const src = "https://accounts.google.com/gsi/client";

    // Already loaded?
    if (window.google?.accounts?.id) return;

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (existing) {
      await new Promise<void>((res) => {
        if ((existing as any).dataset.loaded === "true") res();
        existing.addEventListener("load", () => res(), { once: true });
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = () => {
        (s as any).dataset.loaded = "true";
        resolve();
      };
      s.onerror = () => reject(new Error("Failed to load Google GSI script."));
      document.head.appendChild(s);
    });
  }, []);

  // Initialize Google One Tap
  const initialize = React.useCallback(() => {
    if (hasInitialized.current) return;
    if (!window.google?.accounts?.id || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
        use_fedcm_for_prompt: true, // enables FedCM where supported
        // You can pass additional hints if you have them:
        // login_uri: `${process.env.NEXT_PUBLIC_API_BASE_URL}${loginPath}`,
        // ux_mode: "popup" | "redirect" (One Tap uses prompt; button uses popup typically)
      });

      if (showButton) {
        const host =
          document.getElementById(buttonContainerId) ??
          (() => {
            const el = document.createElement("div");
            el.id = buttonContainerId;
            // Put it at bottom-right by default if not present
            el.style.position = "fixed";
            el.style.bottom = "16px";
            el.style.right = "16px";
            el.style.zIndex = "9999";
            document.body.appendChild(el);
            return el;
          })();

        try {
          window.google.accounts.id.renderButton(host, {
            type: "standard",
            theme: "outline",
            size: "large",
            shape: "pill",
            logo_alignment: "left",
            text: "signin_with",
          });
        } catch (err) {
          report("Failed to render Google button.", err);
        }
      }

      hasInitialized.current = true;

      // Show One Tap prompt
      if (autoPrompt && !hasPrompted.current) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            debug && console.log("One Tap not displayed:", reason);
          } else if (notification.isSkippedMoment()) {
            const reason = notification.getSkippedReason();
            debug && console.log("One Tap skipped:", reason);
          }
        });
        hasPrompted.current = true;
      }
    } catch (err) {
      report("Failed to initialize Google One Tap.", err);
    }
  }, [
    autoPrompt,
    buttonContainerId,
    clientId,
    debug,
    handleCredentialResponse,
    report,
    showButton,
  ]);

  // Orchestrate loading + init
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!enabled) return;

      if (!clientId) {
        report("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
        return;
      }

      try {
        await loadGsiScript();
      } catch (err) {
        report("Unable to load Google SDK.", err);
        return;
      }

      if (!cancelled) initialize();
    };

    run();

    return () => {
      cancelled = true;
      // Best-effort cancel current prompt
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [clientId, enabled, initialize, loadGsiScript, report]);

  // Only show error toast if needed
  return error ? (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm rounded-lg bg-red-50 p-4 shadow-lg">
      <p className="text-sm text-red-800">{error}</p>
    </div>
  ) : null;
}
