// ─── Infographic CMS Builder — Excel Parser ───────────────────────────────────
// Parses Input.xlsx (CRM export) into AdmissionMajorGroup[].
// Uses the existing `xlsx` package already in package.json.

import * as XLSX from 'xlsx';
import type { AdmissionCriteriaRow, AdmissionMajorGroup } from '@/types/infographic';

// Column indices inside Input.xlsx (0-based, row 1 = headers)
const COL = {
    subjectGroupMap: 3,
    name: 4,
    condition: 5,
    gpaMin: 6,
    lngScore: 7,
    configPercent: 8,
    weightTest: 9,
    weightAdmission: 10,
    credits: 11,
    admissionMajor: 19,
    faculty: 20,
    department: 21,
    limitApplicant: 28,
    examTotal: 29,
} as const;

function toNum(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
}

function toBool(v: unknown): boolean {
    return v === 'Yes' || v === true || v === 1;
}

function toStr(v: unknown): string {
    return v == null ? '' : String(v).trim();
}

export async function parseExcelToGroups(file: File): Promise<AdmissionMajorGroup[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    defval: null,
                });

                // Skip header row (index 0)
                const dataRows = rows.slice(1) as unknown[][];

                // Parse each row into AdmissionCriteriaRow
                const criteriaRows: AdmissionCriteriaRow[] = dataRows
                    .filter((r) => r[COL.faculty] && r[COL.admissionMajor])
                    .map((r) => ({
                        subjectGroupMap: toStr(r[COL.subjectGroupMap]),
                        subjectName: toStr(r[COL.name]),
                        condition: toStr(r[COL.condition]),
                        gpaMin: toNum(r[COL.gpaMin]),
                        lngScore: toNum(r[COL.lngScore]),
                        configPercent: toBool(r[COL.configPercent]),
                        weightTest: toNum(r[COL.weightTest]),
                        weightAdmission: toNum(r[COL.weightAdmission]),
                        credits: toNum(r[COL.credits]),
                        admissionMajor: toStr(r[COL.admissionMajor]),
                        faculty: toStr(r[COL.faculty]),
                        department: toStr(r[COL.department]),
                        limitApplicant: toNum(r[COL.limitApplicant]) ?? 0,
                        examTotal: toNum(r[COL.examTotal]) ?? 0,
                    }));

                // Group by (faculty, admissionMajor)
                const groupMap = new Map<string, AdmissionMajorGroup>();
                for (const row of criteriaRows) {
                    const key = `${row.faculty}__${row.admissionMajor}`;
                    if (!groupMap.has(key)) {
                        groupMap.set(key, {
                            faculty: row.faculty,
                            admissionMajor: row.admissionMajor,
                            department: row.department,
                            limitApplicant: row.limitApplicant,
                            examTotal: row.examTotal,
                            criteria: [],
                        });
                    }
                    groupMap.get(key)!.criteria.push(row);
                }

                resolve(Array.from(groupMap.values()));
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
