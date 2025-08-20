import { FileText } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title = "ยังไม่มีรายการ", 
  description = "ไม่พบข้อมูลที่ตรงกับเงื่อนไขที่กำหนด",
  icon
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        {icon || <FileText className="h-6 w-6 text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">{description}</p>
    </div>
  );
}