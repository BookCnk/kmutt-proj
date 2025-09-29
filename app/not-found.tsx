"use client";

import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-6">
      {/* ไอคอนเตือนเท่ ๆ */}
      <div className="mb-6 text-indigo-400">
        <ExclamationTriangleIcon className="h-28 w-28 animate-pulse" />
      </div>

      {/* ตัวเลข 404 */}
      <h1 className="text-7xl font-extrabold text-white drop-shadow-md">404</h1>
      <h2 className="mt-3 text-2xl font-semibold text-gray-200">
        อ๊ะ! ไม่พบหน้าที่คุณต้องการ
      </h2>

      {/* คำอธิบาย */}
      <p className="mt-4 max-w-md text-center text-gray-400">
        หน้าที่คุณพยายามเข้าถึงอาจถูกลบ ย้ายไปที่อื่น หรืออาจพิมพ์ URL
        ไม่ถูกต้อง
      </p>

      {/* ปุ่มกลับหน้าหลัก */}
      <Link
        href="/"
        className="mt-8 rounded-full bg-indigo-500 px-8 py-3 font-medium text-white shadow-lg transition
                   hover:bg-indigo-600 hover:shadow-indigo-500/50">
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
