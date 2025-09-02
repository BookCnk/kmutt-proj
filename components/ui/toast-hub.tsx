"use client";

import * as React from "react";
import {
  Toast,
  ToastBody,
  ToastTitle,
  ToastDescription,
  ToastClose,
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

    // auto close (Radix จะ handle state close ผ่าน onOpenChange)
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, item.duration);

    // cleanup ถ้า unmount
    return () => clearTimeout(t);
  }, []);

  const handleClose = (id: number) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {/* map Toasts ใต้ Provider เสมอ */}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          open={true}
          variant={t.variant}
          onOpenChange={(open) => {
            if (!open) handleClose(t.id);
          }}>
          {/* ถ้าไม่มี ToastBody ในโปรเจกต์คุณ ใช้ div แทนได้:
              <div className="flex min-w-0 flex-col gap-1">
                <ToastTitle>{t.title}</ToastTitle>
                {t.description && <ToastDescription>{t.description}</ToastDescription>}
              </div>
           */}
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
  );
}
