"use client";

import { useRouter } from "next/navigation";
import { SurveyForm } from "@/components/survey-form";
import { FormData } from "@/types/types";

export default function NewSurveyPage() {
  const router = useRouter();

  const handleSubmit = (data: FormData) => {
    console.log("Form submitted:", data);

    setTimeout(() => {
      router.push("/dashboard/overview");
    }, 1500);
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
