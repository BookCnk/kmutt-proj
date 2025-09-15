// components/survey/hooks/useDepartmentsOptions.ts
"use client";

import { useEffect, useState } from "react";
import type { DepartmentOption, LoadingState } from "../types";
import { getDepartmentsByFaculty } from "@/api/departmentService";

export function useDepartmentsOptions(facultyId: string | undefined) {
  const [state, setState] = useState<LoadingState<DepartmentOption[]>>({
    data: [],
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setState({ data: [], loading: true });
      try {
        if (!facultyId) {
          setState({ data: [], loading: false });
          return;
        }
        const res: any = await getDepartmentsByFaculty(String(facultyId));
        const mapped: DepartmentOption[] =
          (res?.data ?? []).map((d: any) => ({
            id: String(d._id),
            name: d.title,
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
  }, [facultyId]);

  return state;
}
