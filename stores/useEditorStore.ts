// ─── Infographic CMS Builder — Editor Store ───────────────────────────────────
import { create } from 'zustand';
import type { AdmissionMajorGroup, FacultyTOCEntry } from '@/types/infographic';

/** Returns true if all majors share identical criteria (merge check) */
function serializeCriteria(group: AdmissionMajorGroup): string {
    const rows = [...group.criteria].sort((a, b) =>
        a.subjectName.localeCompare(b.subjectName),
    );
    return JSON.stringify(
        rows.map((r) => ({
            subjectName: r.subjectName,
            gpaMin: r.gpaMin,
            weightTest: r.weightTest,
            weightAdmission: r.weightAdmission,
            credits: r.credits,
        })),
    );
}

export function haveSameCriteria(majors: AdmissionMajorGroup[]): boolean {
    if (majors.length <= 1) return false;
    const first = serializeCriteria(majors[0]);
    return majors.every((m) => serializeCriteria(m) === first);
}

// ── Helper: compute TOC entries (page numbers) from all groups ─────────────────
export function buildTOCEntries(groups: AdmissionMajorGroup[]): FacultyTOCEntry[] {
    const faculties = groupByFaculty(groups);
    let page = 2; // page 1 = TOC
    return faculties.map(({ faculty, majors }) => {
        const entry: FacultyTOCEntry = { faculty, startPage: page };
        // 1 summary page + 1 merged detail page (or N individual pages)
        const detailPages = haveSameCriteria(majors) ? 1 : majors.length;
        page += 1 + detailPages;
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
    logoUrl: string;

    setMajorGroups: (groups: AdmissionMajorGroup[]) => void;
    scrollToFaculty: (faculty: string | null) => void;
    setLogoUrl: (url: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    majorGroups: [],
    scrollTarget: null,
    logoUrl: '/ICON.png',

    setMajorGroups: (groups) => set({ majorGroups: groups, scrollTarget: null }),
    scrollToFaculty: (faculty) => set({ scrollTarget: faculty }),
    setLogoUrl: (url) => set({ logoUrl: url }),
}));
