// components/survey/AnnouncementBanner.tsx
"use client";

import { Fragment } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";

type Props = {
  term: string;
  text: string;
  calendarUrl: string;
  status?: "open" | "closing" | "closed" | "unknown";
};

function getStatusColor(status: Props["status"]) {
  switch (status) {
    case "open":
      return "bg-green-50 border-green-200 text-green-800";
    case "closing":
      return "bg-orange-50 border-orange-200 text-orange-800";
    case "closed":
      return "bg-red-50 border-red-200 text-red-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800";
  }
}

export default function AnnouncementBanner({
  term,
  text,
  calendarUrl,
  status = "unknown",
}: Props) {
  console.log("Announcement text:", text);
  return (
    <Alert className={getStatusColor(status)}>
      <Calendar className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-3">
        <div>
          <strong>ประกาศการรับสมัคร ภาคการศึกษาที่ {term}</strong>
          <br />
          {text.split("\n").map((line, i) => (
            <Fragment key={i}>
              {line.startsWith("หมายเหตุ") ? (
                <>
                  <br />
                  {line}
                </>
              ) : (
                line
              )}
              {i < text.split("\n").length - 1 && <br />}
            </Fragment>
          ))}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            <span className="ml-1">ปฏิทิน</span>
          </a>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
