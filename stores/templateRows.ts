// src/stores/templateRows.ts
"use client";

import { create } from "zustand";
import { SheetMatrix } from "@/app/admin/export/types";

type TemplateRowsStore = {
  sheet: SheetMatrix | null;
  setSheet: (s: SheetMatrix | null) => void;
};

export const useTemplateRowsStore = create<TemplateRowsStore>((set) => ({
  sheet: null,
  setSheet: (s) => set({ sheet: s }),
}));
