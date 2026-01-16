"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreVertical,
  Trash2,
  ChevronDown,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getUsers, updateUserRole } from "@/api/userService";

/* ---------- Types ---------- */
type Role = "admin" | "user" | string;

type UserDoc = {
  _id: string;
  email: string;
  name: string;
  picture?: string;
  role: Role;
  created_at?: string | number;
  updated_at?: string | number;
};

type UsersResponse = {
  status: boolean;
  info?: {
    page?: number; // ถ้า server ส่งมาก็จะ sync ให้
    limit?: number; // ขนาดหน้า
    currentLength?: number; // บางระบบใช้ชื่อนี้
    currentCount?: number; // บางระบบใช้ชื่อนี้
    total?: number; // บางระบบใช้ชื่อนี้
    totalCount?: number; // บางระบบใช้ชื่อนี้
    pages?: number; // จะไม่ใช้แล้ว คำนวณเองเพื่อความถูกต้อง
  };
  data: UserDoc[];
};

/* ---------- Utils ---------- */
function formatDateTime(input?: string | number) {
  if (!input) return "-";
  const n =
    typeof input === "string" && /^\d+$/.test(input)
      ? Number(input)
      : (input as any);
  const d = new Date(n || input);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ---------- Page ---------- */
export default function AdminUsersPage() {
  const router = useRouter();
  // table rows
  const [rows, setRows] = React.useState<UserDoc[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // server-side paging params
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  // server reported info
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [currentCount, setCurrentCount] = React.useState(0);

  // server-side search
  const [q, setQ] = React.useState("");
  const debouncedName = useDebounce(q, 400);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // ยิง backend พร้อมส่ง name (เฉพาะถ้ามีค่า)
      const res = (await getUsers({
        limit,
        page,
        name: debouncedName || undefined,
      })) as UsersResponse | any;

      // normalize response
      const info = (res?.info ??
        res?.data?.info ??
        res?.meta ??
        res?.pagination ??
        {}) as UsersResponse["info"];
      const list: UserDoc[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      // ใช้ totalCount/currentCount ถ้ามี ไม่งั้น fallback
      const totalFromServer =
        Number(info?.total ?? info?.totalCount ?? list.length) || 0;
      const limitFromServer = Number.isFinite(info?.limit as number)
        ? Number(info!.limit)
        : limit;
      const currentCountVal =
        Number(info?.currentLength ?? info?.currentCount ?? list.length) ||
        list.length;

      // คำนวณ pages เอง (ไม่เชื่อ info.pages อีกต่อไป)
      const computedPages =
        limitFromServer === 0
          ? 1
          : Math.max(1, Math.ceil(totalFromServer / limitFromServer));

      setRows(list);
      setTotal(totalFromServer);
      setCurrentCount(currentCountVal);
      setPages(computedPages);

      // ถ้า server ส่ง page มาชัดเจน ค่อย sync (ไม่บังคับ)
      const pageFromServer = Number(info?.page);
      if (
        Number.isFinite(pageFromServer) &&
        pageFromServer >= 1 &&
        pageFromServer !== page
      ) {
        setPage(pageFromServer);
      }

      // กันกรณี page > pages (เช่นค้นหา/เปลี่ยน limit แล้วจำนวนหน้าลดลง)
      if (page > computedPages) {
        setPage(computedPages);
      }
    } catch (e: any) {
      setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setRows([]);
      setTotal(0);
      setPages(1);
      setCurrentCount(0);
    } finally {
      setLoading(false);
    }
  }, [limit, page, debouncedName]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onChangeSearch = (v: string) => {
    setQ(v);
    setPage(1); // พิมพ์ใหม่ กลับไปหน้า 1
  };

  const onChangeRole = async (id: string, role: "admin" | "user") => {
    try {
      // optimistic update
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, role } : r)));
      await updateUserRole(id, { role });
      toast.success("อัปเดตบทบาทสำเร็จ");
    } catch (e: any) {
      toast.error(e?.message || "อัปเดตบทบาทไม่สำเร็จ");
      fetchUsers(); // rollback
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <button
          type="button"
          aria-label="ย้อนกลับ"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/admin");
            }
          }}
          className="inline-flex items-center gap-2 w-fit rounded-lg px-2 py-1 text-sm font-medium text-blue-600 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
          <ChevronLeft className="h-4 w-4" />
          กลับ
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              จัดการผู้ใช้
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              จำนวนผู้ใช้ทั้งหมด:{" "}
              <span className="font-semibold text-blue-600">{total}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหาผู้ใช้
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                placeholder="ค้นหา ชื่อ (server) หรือ อีเมล (ถ้า backend รองรับ)…"
                value={q}
                onChange={(e) => onChangeSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Limit Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              แสดงต่อหน้า
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full h-11 rounded-lg border border-gray-200 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition hover:bg-gray-50 flex items-center justify-between gap-2 font-medium text-gray-700">
                  {limit === 0 ? "ทั้งหมด" : `${limit} รายการ`}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {[10, 25, 50].map((n) => (
                  <DropdownMenuItem
                    key={n}
                    onClick={() => {
                      setLimit(n);
                      setPage(1);
                    }}
                    className={limit === n ? "bg-blue-50 text-blue-600" : ""}>
                    {n} รายการ
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setLimit(0);
                    setPage(1);
                  }}
                  className={limit === 0 ? "bg-blue-50 text-blue-600" : ""}>
                  ทั้งหมด
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Refresh Button */}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-red-800">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-12">
                  #
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  ผู้ใช้
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  อีเมล
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  บทบาท
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  สร้างเมื่อ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  อัปเดตล่าสุด
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin">
                        <RefreshCw className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        กำลังโหลดข้อมูล…
                      </p>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-600 font-medium">
                        ไม่พบข้อมูลผู้ใช้
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((u, i) => (
                  <tr key={u._id} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-600">
                        {(page - 1) * Math.max(1, limit || 1) + (i + 1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={u.name}
                            src={u.picture}
                            className="h-10 w-10 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = "none";
                              img.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm ${
                            !u.picture ? "" : "hidden"
                          }`}>
                          {(u.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {u.name || "-"}
                          </div>
                          <div className="text-xs text-gray-500">ผู้ใช้ #</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${u.email}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium">
                        {u.email}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`px-3 py-2 rounded-lg font-semibold text-sm border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition hover:opacity-80 flex items-center gap-2 ${
                              u.role === "admin"
                                ? "border-orange-200 bg-orange-50 text-orange-700 focus:border-orange-500 focus:ring-orange-100"
                                : "border-gray-200 bg-gray-50 text-gray-700 focus:border-gray-500 focus:ring-gray-100"
                            }`}>
                            {u.role === "admin" ? "👑 Admin" : "👤 User"}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => onChangeRole(u._id, "user")}
                            className={
                              u.role === "user"
                                ? "bg-blue-50 text-blue-600"
                                : ""
                            }>
                            👤 User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onChangeRole(u._id, "admin")}
                            className={
                              u.role === "admin"
                                ? "bg-blue-50 text-blue-600"
                                : ""
                            }>
                            👑 Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(u.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(u.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                            ลบผู้ใช้
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{total}</span> รายการ •
          <span className="font-semibold text-gray-900 ml-1">
            {currentCount}
          </span>{" "}
          ในหน้านี้ •
          <span className="font-semibold text-gray-900 ml-1">หน้า {page}</span>{" "}
          / {pages}
        </div>

        <div className="flex itemsänger gap-2">
          <button
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}>
            <ChevronLeft className="w-4 h-4" />
            ก่อนหน้า
          </button>
          <div className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold">
            หน้า {page}
          </div>
          <button
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || loading}>
            ถัดไป
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
