// components/survey/hooks/useFacultiesOptions.ts
"use client";

import { useEffect, useState } from "react";
import type { Option } from "../types";
import type { LoadingState } from "../types";
import { getFaculties } from "@/api/facultyService";

export function useFacultiesOptions() {
  const [state, setState] = useState<LoadingState<Option[]>>({
    data: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const res: any = await getFaculties();
        const options: Option[] =
          (res?.data ?? []).map((f: any) => ({
            value: String(f._id),
            label: f.title,
          })) || [];
        if (!cancelled) setState({ data: options, loading: false });
      } catch (e: any) {
        if (!cancelled)
          setState({ data: [], loading: false, error: e?.message || "error" });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
