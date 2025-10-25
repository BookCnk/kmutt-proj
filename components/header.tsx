"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, File } from "lucide-react";

interface HeaderProps {
  onLogout?: () => void;
}

function getInitials(name?: string, email?: string) {
  const src = (name && name.trim()) || email || "";
  if (!src) return "U";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function Header({ onLogout }: HeaderProps) {
  const router = useRouter();
  const { user, clear, setSession } = useAuthStore();

  // hydrate user จาก localStorage (เผื่อโปรเจกต์เดิมยังเก็บไว้)
  React.useEffect(() => {
    if (!user) {
      try {
        const raw = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (raw && token) {
          const u = JSON.parse(raw);
          if (u?.email) setSession(u, token);
        }
      } catch {}
    }
  }, [user, setSession]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    } finally {
      clear();
      localStorage.removeItem("token"); // รองรับโค้ดเก่า
      localStorage.removeItem("user");
      onLogout?.();
      router.push("/login");
    }
  };

  const initials = getInitials(user?.name, user?.email);
  const roleLabel = user?.role || "guest";

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                แบบสำรวจการคัดเลือกนักศึกษา KMUTT
              </h1>
            </div>
          </div>

          {/* ถ้ายังไม่ล็อกอิน ให้โชว์ปุ่มไปหน้า login */}
          {!user ? (
            <Button asChild>
              <Link href="/login">เข้าสู่ระบบ</Link>
            </Button>
          ) : (
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 space-x-2 px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.picture}
                        alt={user.name || user.email}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 text-left">
                      <span className="text-sm font-medium">
                        {user.name || user.email}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {roleLabel}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name || initials}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* ตัวอย่างเมนู (โชว์สำหรับ admin เท่านั้น) */}
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" className="w-full">
                          <User className="mr-2 h-4 w-4" />
                          <span>ผู้ใช้งานทั้งหมด</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/export" className="w-full">
                          <File className="mr-2 h-4 w-4" />
                          <span>export จาก excel</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
