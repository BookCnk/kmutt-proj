// ─── Infographic CMS Builder ─────────────────────────────────────────────────
// New types for the WYSIWYG infographic builder feature.
// These do NOT modify or re-export any existing type file.

export interface AdmissionCriteriaRow {
    subjectGroupMap: string;
    subjectName: string;
    condition: string; // 'และ' | 'หรือ'
    gpaMin: number | null;
    lngScore: number | null;
    configPercent: boolean;
    weightTest: number | null;
    weightAdmission: number | null;
    credits: number | null;
    admissionMajor: string;
    faculty: string;
    department: string;
    limitApplicant: number;
    examTotal: number;
}

/** One infographic "page" = one admission major with all its criteria rows */
export interface AdmissionMajorGroup {
    faculty: string;
    admissionMajor: string;
    department: string;
    limitApplicant: number;
    examTotal: number;
    criteria: AdmissionCriteriaRow[];
}

export type ElementType = 'text' | 'faculty-header' | 'criteria-table';

export interface CanvasElementStyles {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
}

export interface CanvasElement {
    id: string;
    type: ElementType;
    /** text → string | faculty-header / criteria-table → AdmissionMajorGroup */
    content: string | AdmissionMajorGroup;
    styles: CanvasElementStyles;
}
