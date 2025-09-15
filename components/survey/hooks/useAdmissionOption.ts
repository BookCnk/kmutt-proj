// components/survey/hooks/useAdmissionOption.ts
"use client";

import { useEffect, useState } from "react";
import type { LoadingState } from "../types";
import { getAdmissions } from "@/api/admissionService";
import type { Admission } from "../fields/IntakeModeRadios";

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
        const raw = Array.isArray(res?.data) ? res.data : [];
        const mapped: Admission[] = raw.map((a: any) => ({
          ...a,
          rounds: (a.rounds ?? []).map((r: any) => ({
            no: Number(r.no),
            interview_date: String(r.interview_date),
            open: r.open ?? true,
            _id: r._id?.toString?.(),
          })),
          monthly: (a.monthly ?? []).map((m: any) => ({
            month: m.month,
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
