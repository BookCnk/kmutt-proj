// ─── Infographic CMS Builder — Editor Store ───────────────────────────────────
import { create } from 'zustand';
import type { AdmissionMajorGroup, FacultyTOCEntry } from '@/types/infographic';

// ── Helper: compute TOC entries (page numbers) from all groups ─────────────────
export function buildTOCEntries(groups: AdmissionMajorGroup[]): FacultyTOCEntry[] {
    const facultyOrder: string[] = [];
    const facultyMajorCount: Record<string, number> = {};

    for (const g of groups) {
        if (!facultyMajorCount[g.faculty]) {
            facultyOrder.push(g.faculty);
            facultyMajorCount[g.faculty] = 0;
        }
        facultyMajorCount[g.faculty]++;
    }

    let page = 2; // page 1 = TOC
    return facultyOrder.map((faculty) => {
        const entry: FacultyTOCEntry = { faculty, startPage: page };
        // 1 summary page + N major pages
        page += 1 + facultyMajorCount[faculty];
        return entry;
    });
}

/** Groups by faculty, preserving insertion order */
export function groupByFaculty(
    groups: AdmissionMajorGroup[]
): { faculty: string; majors: AdmissionMajorGroup[] }[] {
    const map = new Map<string, AdmissionMajorGroup[]>();
    for (const g of groups) {
        if (!map.has(g.faculty)) map.set(g.faculty, []);
        map.get(g.faculty)!.push(g);
    }
    return Array.from(map.entries()).map(([faculty, majors]) => ({ faculty, majors }));
}

interface EditorState {
    majorGroups: AdmissionMajorGroup[];
    /** Faculty name to scroll to; null = scroll to top (TOC) */
    scrollTarget: string | null;

    setMajorGroups: (groups: AdmissionMajorGroup[]) => void;
    scrollToFaculty: (faculty: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    majorGroups: [],
    scrollTarget: null,

    setMajorGroups: (groups) => set({ majorGroups: groups, scrollTarget: null }),
    scrollToFaculty: (faculty) => set({ scrollTarget: faculty }),
}));
