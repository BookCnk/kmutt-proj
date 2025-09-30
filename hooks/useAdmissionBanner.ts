"use client";

import * as React from "react";
import { getAdmissions } from "@/api/admissionService";

type Banner = {
  term: string;
  text: string;
  calendarUrl: string;
  status: "open" | "closing" | "closed" | "unknown";
  raw?: any; 
};

const within = (now: number, startISO?: string, endISO?: string) => {
  if (!startISO || !endISO) return false;
  const s = Date.parse(startISO);
  const e = Date.parse(endISO);
  if (Number.isNaN(s) || Number.isNaN(e)) return false;
  return now >= s && now <= e;
};

const computeStatus = (
  open_at?: string,
  close_at?: string,
  now = Date.now()
): Banner["status"] => {
  const s = Date.parse(open_at ?? "");
  const e = Date.parse(close_at ?? "");
  if (Number.isNaN(s) || Number.isNaN(e)) return "unknown";
  if (now < s) return "unknown";
  if (now > e) return "closed";
  return e - now <= 1000 * 60 * 60 * 48 ? "closing" : "open"; // เหลือ <= 48 ชม. เป็น closing
};

function pickBannerFromAdmissions(list: any[]): Banner {
  if (!Array.isArray(list) || list.length === 0) {
    return {
      term: "—",
      text: "ยังไม่มีประกาศรับสมัคร",
      calendarUrl: "#",
      status: "unknown",
    };
  }

  const now = Date.now();
  // เรียงจาก term.sort_key มาก→น้อย (ล่าสุดมาก่อน)
  const sorted = [...list].sort(
    (a, b) => (b?.term?.sort_key ?? 0) - (a?.term?.sort_key ?? 0)
  );

  // หาอันที่ active ตอนนี้ (อยู่ในช่วงเวลา)
  const active =
    sorted.find((a) =>
      within(
        now,
        a?.application_window?.open_at,
        a?.application_window?.close_at
      )
    ) ?? sorted[0];

  const term = active?.term?.label ?? "—";
  const text =
    active?.application_window?.notice ?? "ยังไม่ได้กรอกข้อความประกาศ";
  const calendarUrl = active?.application_window?.calendar_url ?? "#";
  const status = computeStatus(
    active?.application_window?.open_at,
    active?.application_window?.close_at,
    now
  );

  return { term, text, calendarUrl, status, raw: active };
}

export function useAdmissionBanner() {
  const [banner, setBanner] = React.useState<Banner | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res: any = await getAdmissions();
        // รองรับทั้ง {status, data: [...]} และคืน array ตรง ๆ
        const list: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        const b = pickBannerFromAdmissions(list);
        if (!cancelled) setBanner(b);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "โหลดประกาศรับสมัครไม่สำเร็จ");
          setBanner(
            pickBannerFromAdmissions([]) // fallback
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // สะดวกเผื่ออยากรู้ว่า window เปิดอยู่ไหม (เช่นใช้กับ WindowStatusAlert)
  const isWindowOpen = React.useMemo(() => {
    const raw = banner?.raw;
    if (!raw) return false;
    return within(
      Date.now(),
      raw?.application_window?.open_at,
      raw?.application_window?.close_at
    );
  }, [banner]);

  return { banner, loading, error, isWindowOpen };
}
