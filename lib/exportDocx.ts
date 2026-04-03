// ─── Infographic Builder — DOCX Export ─────────────────────────────────────────
// Generates an MS Word document mirroring the infographic structure.

import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    WidthType,
    AlignmentType,
    BorderStyle,
    HeadingLevel,
    ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { AdmissionMajorGroup, AdmissionCriteriaRow } from '@/types/infographic';
import { groupByFaculty, haveSameCriteria } from '@/stores/useEditorStore';

// ── helpers mirroring MajorPage logic ─────────────────────────────────────────

function minLabel(row: AdmissionCriteriaRow): string {
    const name = row.subjectName?.trim() ?? '';
    if (
        name.includes('สอบสัมภาษณ์') ||
        name.includes('แฟ้มสะสมผลงาน') ||
        name.includes('สอบความถนัด') ||
        name.includes('สอบวัดความถนัด')
    ) return '-';
    if (row.gpaMin != null) {
        if (row.gpaMin === 1) return 'ไม่กำหนดขั้นต่ำ';
        return String(row.gpaMin);
    }
    if (row.lngScore != null) return String(row.lngScore);
    return 'ไม่กำหนดขั้นต่ำ';
}

function dedup(rows: AdmissionCriteriaRow[]): AdmissionCriteriaRow[] {
    const seen = new Set<string>();
    return rows.filter((r) => {
        const key = `${r.subjectName}|${r.gpaMin}|${r.weightTest}|${r.weightAdmission}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function creditRows(criteria: AdmissionCriteriaRow[]) {
    return Array.from(
        new Map(
            criteria
                .filter((r) => r.subjectName?.trim() && r.credits != null)
                .map((r) => [r.subjectName.trim(), r]),
        ).values(),
    );
}

// ── DOCX building blocks ───────────────────────────────────────────────────────

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function cell(text: string, opts: {
    bold?: boolean;
    shade?: string;
    colSpan?: number;
    align?: typeof AlignmentType[keyof typeof AlignmentType];
} = {}): TableCell {
    return new TableCell({
        columnSpan: opts.colSpan,
        shading: opts.shade ? { fill: opts.shade, type: ShadingType.SOLID } : undefined,
        borders: BORDERS,
        children: [
            new Paragraph({
                alignment: opts.align ?? AlignmentType.LEFT,
                children: [
                    new TextRun({
                        text,
                        bold: opts.bold ?? false,
                        font: 'TH Sarabun New',
                        size: 28, // 14pt
                    }),
                ],
            }),
        ],
    });
}

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2): Paragraph {
    return new Paragraph({
        heading: level,
        children: [new TextRun({ text, bold: true, font: 'TH Sarabun New', size: 32 })],
    });
}

function para(text: string, bold = false): Paragraph {
    return new Paragraph({
        children: [new TextRun({ text, bold, font: 'TH Sarabun New', size: 28 })],
    });
}

// ── Summary table for a faculty ────────────────────────────────────────────────

function buildSummaryTable(majors: AdmissionMajorGroup[]): Table {
    const headerRow = new TableRow({
        children: [
            cell('สาขาวิชา', { bold: true, shade: 'F4B083', align: AlignmentType.CENTER }),
            cell('จำนวนเรียกสอบคัดเลือก* (คน)', { bold: true, shade: 'A6A6A6', align: AlignmentType.CENTER }),
            cell('จำนวนรับเข้าศึกษา (คน)', { bold: true, shade: 'A6A6A6', align: AlignmentType.CENTER }),
        ],
    });

    const dataRows = majors.map((g) =>
        new TableRow({
            children: [
                cell(
                    g.admissionMajor + (g.specialConditionRef != null ? ` (${g.specialConditionRef})` : ''),
                    { shade: 'FBE4D5' }
                ),
                cell(g.examTotal === 0 ? 'ทุกคนที่ผ่านเกณฑ์' : String(g.examTotal), { align: AlignmentType.CENTER }),
                cell(g.limitApplicant === 0 ? '-' : String(g.limitApplicant), { align: AlignmentType.CENTER }),
            ],
        }),
    );

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
    });
}

// ── Detail section for a major (or merged) ─────────────────────────────────────

function buildDetailSection(group: AdmissionMajorGroup, isMerged = false): (Paragraph | Table)[] {
    const sections: (Paragraph | Table)[] = [];

    if (!isMerged) {
        sections.push(heading(group.admissionMajor, HeadingLevel.HEADING_3));
    }

    // Credits table
    const crRows = creditRows(group.criteria);
    if (crRows.length > 0) {
        sections.push(para('จำนวนหน่วยกิตขั้นต่ำของกลุ่มสาระการเรียนรู้', true));
        const creditsTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        cell('หน่วยกิตรวมของกลุ่มสาระการเรียนรู้', { bold: true, shade: 'BFBFBF' }),
                        cell('หน่วยกิตขั้นต่ำ', { bold: true, shade: 'BFBFBF', align: AlignmentType.CENTER }),
                    ],
                }),
                ...crRows.map((r) =>
                    new TableRow({
                        children: [
                            cell(r.subjectName.trim()),
                            cell(r.credits === 1 ? 'ไม่กำหนดขั้นต่ำ' : String(r.credits), { align: AlignmentType.CENTER }),
                        ],
                    }),
                ),
            ],
        });
        sections.push(creditsTable, new Paragraph({ text: '' }));
    }

    // Criteria table
    const criteria = dedup(group.criteria);
    const totalTest = criteria.reduce((s, r) => s + (r.weightTest ?? 0), 0);
    const totalAdmission = criteria.reduce((s, r) => s + (r.weightAdmission ?? 0), 0);

    sections.push(para('เกณฑ์การพิจารณา', true));
    const criteriaTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    cell('รายการ', { bold: true, shade: 'BFBFBF' }),
                    cell('เกรดเฉลี่ย / คะแนนขั้นต่ำ', { bold: true, shade: 'D9D9D9', align: AlignmentType.CENTER }),
                    cell('ค่าน้ำหนัก % (สอบคัดเลือก)', { bold: true, shade: 'D9D9D9', align: AlignmentType.CENTER }),
                    cell('ค่าน้ำหนัก % (รับเข้าศึกษา)', { bold: true, shade: 'C5E0B3', align: AlignmentType.CENTER }),
                ],
            }),
            ...criteria.map((r) =>
                new TableRow({
                    children: [
                        cell(r.subjectName),
                        cell(minLabel(r), { align: AlignmentType.CENTER }),
                        cell(r.weightTest != null && r.weightTest > 0 ? String(r.weightTest) : '-', { align: AlignmentType.CENTER }),
                        cell(r.weightAdmission != null && r.weightAdmission > 0 ? String(r.weightAdmission) : '-', { shade: 'E2EFD9', align: AlignmentType.CENTER }),
                    ],
                }),
            ),
            new TableRow({
                children: [
                    cell('รวม', { bold: true, colSpan: 2, align: AlignmentType.RIGHT }),
                    cell(totalTest > 0 ? String(totalTest) : '-', { bold: true, align: AlignmentType.CENTER }),
                    cell(totalAdmission > 0 ? String(totalAdmission) : '-', { bold: true, shade: 'E2EFD9', align: AlignmentType.CENTER }),
                ],
            }),
        ],
    });
    sections.push(criteriaTable, new Paragraph({ text: '' }));

    // Conditional remarks
    const hasGpaNoMin = criteria.some((r) => r.gpaMin === 1);
    const hasTgatTpat = criteria.some((r) => r.subjectName?.includes('TGAT') || r.subjectName?.includes('TPAT'));
    const isEngineering = group.faculty.includes('วิศวกรรม');

    if (hasGpaNoMin || hasTgatTpat || isEngineering) {
        sections.push(para('หมายเหตุ', true));
        if (hasGpaNoMin) sections.push(para('1. คะแนน GPA คณิตศาสตร์ และวิทยาศาสตร์ ไม่กำหนดขั้นต่ำแต่ต้องมีคะแนน หากนักเรียนไม่กรอกคะแนนในระบบรับสมัคร จะถือว่าไม่ผ่านเกณฑ์การรับสมัคร'));
        if (hasTgatTpat) sections.push(para('2. คะแนนทดสอบวิชา TGAT/TPAT ไม่กำหนดขั้นต่ำแต่ต้องมีคะแนน มหาวิทยาลัยฯ จะดึงคะแนนจากฐานข้อมูลเอง ผู้สมัครไม่ต้องกรอกคะแนน'));
        if (isEngineering) sections.push(para('4. สำหรับคณะวิศวกรรมศาสตร์ ผู้สมัครที่มีผลการทดสอบภาษาอังกฤษมาตรฐาน CEFR Level B2 หรือการทดสอบอื่นในระดับที่เทียบเท่า สามารถนำผลคะแนนมาใส่แฟ้มสะสมผลงาน (Portfolio) เพื่อใช้ในการประกอบการพิจารณาเป็นพิเศษ'));
    }

    return sections;
}

// ── Main export function ───────────────────────────────────────────────────────

export async function exportToDocx(majorGroups: AdmissionMajorGroup[], filename: string): Promise<void> {
    const faculties = groupByFaculty(majorGroups);
    const allSections: (Paragraph | Table)[] = [];

    allSections.push(heading('เกณฑ์การรับสมัครนักศึกษา รอบที่ 2 (ปีการศึกษา 2569)', HeadingLevel.HEADING_1));
    allSections.push(new Paragraph({ text: '' }));

    for (const { faculty, majors } of faculties) {
        // Faculty heading
        allSections.push(heading(faculty, HeadingLevel.HEADING_2));

        // Summary table
        allSections.push(buildSummaryTable(majors));
        allSections.push(
            para('สอบคัดเลือก* หมายถึง สอบสัมภาษณ์ และ/หรือสอบทักษะขั้นพื้นฐาน เพื่อประเมินความถนัดทางวิชาชีพ/ความสามารถพิเศษ'),
        );
        allSections.push(new Paragraph({ text: '' }));

        // Detail section(s)
        if (haveSameCriteria(majors)) {
            allSections.push(heading(`${faculty} (ต่อ) — ทุกสาขาวิชา`, HeadingLevel.HEADING_3));
            allSections.push(...buildDetailSection(majors[0], true));
        } else {
            for (const group of majors) {
                allSections.push(...buildDetailSection(group, false));
            }
        }

        allSections.push(new Paragraph({ text: '' }));
    }

    const doc = new Document({
        sections: [{ children: allSections }],
        styles: {
            default: {
                document: {
                    run: { font: 'TH Sarabun New', size: 28 },
                },
            },
        },
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
}
