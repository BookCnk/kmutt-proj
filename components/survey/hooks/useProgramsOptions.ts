// components/survey/hooks/useProgramsOptions.ts
"use client";

import { useEffect, useState } from "react";
import type { ProgramOption, LoadingState } from "../types";
import { getProgramsByDepartment } from "@/api/programService";

export function useProgramsOptions(departmentId: string | undefined) {
  const [state, setState] = useState<LoadingState<ProgramOption[]>>({
    data: [],
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setState({ data: [], loading: true });
      try {
        if (!departmentId) {
          setState({ data: [], loading: false });
          return;
        }
        const res: any = await getProgramsByDepartment(String(departmentId));
        const mapped: ProgramOption[] =
          (res?.data ?? []).map((p: any) => ({
            id: String(p._id),
            name: p.title,
            open: !!p.active,
          })) || [];
        if (!cancelled) setState({ data: mapped, loading: false });
      } catch (e: any) {
        if (!cancelled)
          setState({ data: [], loading: false, error: e?.message || "error" });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  return state;
}
