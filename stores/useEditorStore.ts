// ─── Infographic CMS Builder — Editor Store ───────────────────────────────────
// Zustand store for the WYSIWYG builder page.
// Entirely separate from the existing auth.ts and templateRows.ts stores.

import { create } from 'zustand';
import type { AdmissionMajorGroup, CanvasElement, CanvasElementStyles } from '@/types/infographic';

interface EditorState {
    /** All major groups parsed from the uploaded Excel */
    majorGroups: AdmissionMajorGroup[];
    /** Index in majorGroups currently loaded onto the canvas */
    selectedGroupIndex: number;
    /** Elements placed on the A4 canvas */
    canvasElements: CanvasElement[];
    /** ID of the currently selected element (for PropertiesPanel) */
    selectedElementId: string | null;

    // ── Actions ──────────────────────────────────────────────────────────────
    setMajorGroups: (groups: AdmissionMajorGroup[]) => void;
    setSelectedGroup: (index: number) => void;
    /** Replace the canvas with the default layout for the selected group */
    loadGroupToCanvas: (group: AdmissionMajorGroup) => void;
    addElement: (element: CanvasElement) => void;
    updateElement: (id: string, patch: Partial<Omit<CanvasElement, 'id'>>) => void;
    updateElementStyles: (id: string, styles: Partial<CanvasElementStyles>) => void;
    removeElement: (id: string) => void;
    setSelectedElement: (id: string | null) => void;
    clearCanvas: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    majorGroups: [],
    selectedGroupIndex: 0,
    canvasElements: [],
    selectedElementId: null,

    setMajorGroups: (groups) => set({ majorGroups: groups }),

    setSelectedGroup: (index) => set({ selectedGroupIndex: index }),

    loadGroupToCanvas: (group) => {
        const headerEl: CanvasElement = {
            id: 'faculty-header',
            type: 'faculty-header',
            content: group,
            styles: { x: 20, y: 20, width: 754, height: 180 },
        };
        const tableEl: CanvasElement = {
            id: 'criteria-table',
            type: 'criteria-table',
            content: group,
            styles: { x: 20, y: 220, width: 754, height: 600 },
        };
        set({ canvasElements: [headerEl, tableEl], selectedElementId: null });
    },

    addElement: (element) =>
        set((s) => ({ canvasElements: [...s.canvasElements, element] })),

    updateElement: (id, patch) =>
        set((s) => ({
            canvasElements: s.canvasElements.map((el) =>
                el.id === id ? { ...el, ...patch } : el
            ),
        })),

    updateElementStyles: (id, styles) =>
        set((s) => ({
            canvasElements: s.canvasElements.map((el) =>
                el.id === id ? { ...el, styles: { ...el.styles, ...styles } } : el
            ),
        })),

    removeElement: (id) =>
        set((s) => ({
            canvasElements: s.canvasElements.filter((el) => el.id !== id),
            selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
        })),

    setSelectedElement: (id) => set({ selectedElementId: id }),

    clearCanvas: () => set({ canvasElements: [], selectedElementId: null }),
}));
