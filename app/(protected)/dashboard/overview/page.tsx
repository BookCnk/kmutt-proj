"use client";

import { useRouter } from "next/navigation";
import { SurveyTable } from "@/components/survey-table";

export default function DashboardOverviewPage() {
  const router = useRouter();

  const handleCreateNew = () => {
    router.push("/survey/new");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="text-gray-600 mt-2">ภาพรวมข้อมูลแบบสำรวจการคัดเลือกนักศึกษา</p>
        </div>
      </div>

      <SurveyTable onCreateNew={handleCreateNew} />
    </div>
  );
}