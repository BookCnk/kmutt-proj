// components/survey/hooks/useAdmissionOption.ts
"use client";

import { useEffect, useState } from "react";
import type { LoadingState } from "../types";
import { getAdmissions } from "@/api/admissionService";
import type { Admission } from "../fields/IntakeModeRadios";
import { MONTHS_TH } from "@/lib/date-utils";

// แปลงค่าที่ backend อาจส่งมาเป็นเลขเดือน -> ชื่อเดือนภาษาไทย
function normalizeMonthToTH(monthLike: unknown): string | undefined {
  if (typeof monthLike === "string" && monthLike.trim()) {
    // ถ้าเป็น string อยู่แล้ว (เช่น "มกราคม") ก็ส่งกลับเลย
    return monthLike.trim();
  }
  const n = Number(monthLike);
  if (Number.isFinite(n) && n >= 1 && n <= 12) {
    return MONTHS_TH[n - 1];
  }
  return undefined;
}

export function useAdmissionOption(): LoadingState<Admission[]> {
  const [state, setState] = useState<LoadingState<Admission[]>>({
    data: [],
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState({ data: [], loading: true });
      try {
        const res: any = await getAdmissions();

        // รองรับทั้งรูปแบบ {data: [...]}, {items: [...]}, หรือเป็น array ตรง ๆ
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.items)
          ? res.items
          : [];

        const mapped: Admission[] = raw.map((a: any) => ({
          ...a,
          rounds: (a.rounds ?? []).map((r: any, idx: number) => ({
            no: Number(r.no),
            title:
              typeof r.title === "string" && r.title.trim()
                ? r.title
                : `รอบที่ ${Number(r.no) || idx + 1}`, // เติมค่าเริ่มต้นหากไม่มี title
            interview_date: String(r.interview_date),
            open: r.open ?? true,
            _id: r._id?.toString?.(),
          })),
          monthly: (a.monthly ?? []).map((m: any, idx: number) => ({
            month:
              normalizeMonthToTH(m.month) ??
              // ถ้าไม่มี month ให้เดาจาก interview_date (ถ้าทำได้) หรือตั้งเป็น "-"
              (() => {
                try {
                  const d = new Date(String(m.interview_date));
                  if (!isNaN(d.getTime())) {
                    return MONTHS_TH[d.getMonth()];
                  }
                } catch {}
                return "-";
              })(),
            title:
              typeof m.title === "string" && m.title.trim()
                ? m.title
                : `รอบที่ ${idx + 1}`, // เติมค่าเริ่มต้นหากไม่มี title
            interview_date: String(m.interview_date),
            open: m.open ?? true,
            _id: m._id?.toString?.(),
          })),
        }));

        if (!cancelled) setState({ data: mapped, loading: false });
      } catch (e: any) {
        if (!cancelled)
          setState({
            data: [],
            loading: false,
            error: e?.message || "failed to fetch admissions",
          });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
