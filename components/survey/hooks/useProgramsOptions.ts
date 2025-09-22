// components/survey/hooks/useProgramsOptions.ts
"use client";

import { useEffect, useState } from "react";
import type { ProgramOption, LoadingState } from "../types";
import { getProgramsByDepartment } from "@/api/programService";

function pickProgramArray(res: any): any[] {
  const d = res?.data ?? res;

  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.program)) return d.program;
  if (Array.isArray(d?.program?.root)) return d.program.root;
  if (Array.isArray(d?.items)) return d.items; 
  if (Array.isArray(d?.results)) return d.results; 
  return [];
}

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

        const res = await getProgramsByDepartment(String(departmentId));
        const arr = pickProgramArray(res);

        const mapped: ProgramOption[] = arr.map((p: any) => ({
          id: String(p._id ?? p.id ?? ""),
          name: p.title ?? p.name ?? "-",
          open: Boolean(p.active ?? p.open ?? true),
          degree_level: p.degree_level ?? p.degreeLevel ?? undefined,
        }));

        if (!cancelled) setState({ data: mapped, loading: false });
      } catch (e: any) {
        if (!cancelled)
          setState({
            data: [],
            loading: false,
            error: e?.message || "error",
          });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  return state;
}
