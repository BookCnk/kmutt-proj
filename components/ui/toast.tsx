"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------------
 * Provider & Viewport
 * -------------------------------------------------------------------------------*/

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // ตำแหน่งมุมล่างขวา (มือถือขึ้นบน)
      "fixed z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4",
      "sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      "top-0 left-0 sm:left-auto",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

/* --------------------------------------------------------------------------------
 * Variants (ขอบ + พื้นหลังสีอ่อน) + Motion
 * -------------------------------------------------------------------------------*/

const toastVariants = cva(
  [
    "group pointer-events-auto relative w-full overflow-hidden rounded-md border p-4 pr-10 shadow-lg",
    "flex items-start gap-3",
    // Motion
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-100",
        success:
          "border-green-300 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950/40 dark:text-green-100",
        warning:
          "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-100",
        destructive:
          "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/* --------------------------------------------------------------------------------
 * Root
 * -------------------------------------------------------------------------------*/

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

/* --------------------------------------------------------------------------------
 * Title & Description
 * -------------------------------------------------------------------------------*/

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-5", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

/* --------------------------------------------------------------------------------
 * Action & Close
 * -------------------------------------------------------------------------------*/

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "ml-auto inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium",
      "bg-transparent hover:bg-black/5 dark:hover:bg-white/10",
      "transition-colors ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/60 opacity-0 transition-opacity",
      "hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2",
      "group-hover:opacity-100",
      className
    )}
    aria-label="Close notification"
    {...props}>
    <X className="h-4 w-4" aria-hidden="true" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

/* --------------------------------------------------------------------------------
 * Icon (เลือกตาม variant)
 * -------------------------------------------------------------------------------*/

function ToastIcon({
  variant = "default",
  className,
}: {
  variant?: VariantProps<typeof toastVariants>["variant"];
  className?: string;
}) {
  const cls = cn("mt-0.5 h-5 w-5 shrink-0", className);
  switch (variant) {
    case "success":
      return <CheckCircle2 className={cls} aria-hidden="true" />;
    case "warning":
      return <AlertTriangle className={cls} aria-hidden="true" />;
    case "destructive":
      return <XCircle className={cls} aria-hidden="true" />;
    default:
      return <Info className={cls} aria-hidden="true" />;
  }
}

/* --------------------------------------------------------------------------------
 * Compound: ToastBody — ช่วยจัด layout ไอคอน + เนื้อหา (ทางเลือก)
 * -------------------------------------------------------------------------------*/

function ToastBody({
  children,
  variant = "default",
  className,
}: React.PropsWithChildren<{
  variant?: VariantProps<typeof toastVariants>["variant"];
  className?: string;
}>) {
  return (
    <div className={cn("flex w-full items-start gap-3", className)}>
      <ToastIcon variant={variant} />
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------------------------
 * Toaster — ติดตั้งครั้งเดียวใน root (เช่น app/layout.tsx)
 * -------------------------------------------------------------------------------*/

function Toaster({
  children,
  ...providerProps
}: React.ComponentPropsWithoutRef<typeof ToastProvider>) {
  return (
    <ToastProvider {...providerProps}>
      {children}
      <ToastViewport />
    </ToastProvider>
  );
}

/* --------------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------------*/

export {
  // types
  type VariantProps as _ToastVariantProps, // เผื่อใช้อ้างอิงภายนอก
  // primitives
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  // helpers
  ToastIcon,
  ToastBody,
  Toaster,
};
