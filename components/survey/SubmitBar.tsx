// components/survey/SubmitBar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

type Props = {
  onBack?: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
};

export default function SubmitBar({ onBack, isSubmitting, disabled }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-6">
      {onBack && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto">
          กลับ
        </Button>
      )}
      <Button
        type="submit"
        disabled={!!disabled || isSubmitting}
        className="w-full sm:flex-1">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            กำลังส่งข้อมูล...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            ส่งข้อมูล
          </>
        )}
      </Button>
    </div>
  );
}
