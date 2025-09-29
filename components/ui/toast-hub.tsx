"use client";

import * as React from "react";
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";

type Variant = "default" | "success" | "warning" | "destructive";

type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  variant?: Variant;
  duration?: number; // ms
};

const ToastContext = React.createContext<{
  toast: (msg: Omit<ToastMessage, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastHub />");
  return ctx.toast;
}

export function ToastHub() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Date.now() + Math.random();
    const item: ToastMessage = { id, duration: 4000, ...msg };
    setToasts((prev) => [...prev, item]);

    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, item.duration);

    return () => clearTimeout(t);
  }, []);

  const handleClose = (id: number) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastProvider>
      <ToastContext.Provider value={{ toast }}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            open={true}
            variant={t.variant}
            onOpenChange={(open) => {
              if (!open) handleClose(t.id);
            }}>
            <div className="flex min-w-0 flex-col gap-1">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && (
                <ToastDescription>{t.description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        ))}
      </ToastContext.Provider>
      {/* viewport ของ Radix/Shadcn */}
      <ToastViewport />
    </ToastProvider>
  );
}
