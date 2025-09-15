// components/survey/WindowStatusAlert.tsx
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function WindowStatusAlert({ isOpen }: { isOpen: boolean }) {
  if (isOpen) return null;
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        การรับสมัครได้ปิดรับแล้ว หรือยังไม่ถึงเวลาเปิดรับสมัคร
      </AlertDescription>
    </Alert>
  );
}
