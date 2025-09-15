// components/survey/NewSurveyClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SurveyForm from "./SurveyForm";
import type { FormValues } from "./schema";

export default function NewSurveyClient() {
  const router = useRouter();

  const handleSubmit = (data: FormValues) => {
    console.log("Form submitted:", data);
    toast.success("ส่งข้อมูลสำเร็จ", {
      description: "ข้อมูลแบบสำรวจได้รับการบันทึกเรียบร้อยแล้ว",
    });
    router.push("/dashboard/overview");
  };

  const handleBack = () => {
    router.push("/dashboard/overview");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <SurveyForm onSubmit={handleSubmit} onBack={handleBack} />
      </div>
    </div>
  );
}
