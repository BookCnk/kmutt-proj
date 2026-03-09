'use client';

// ─── FacultyHeader ────────────────────────────────────────────────────────────
// Renders the top "header block" for a single admission major page,
// matching the Criteria.pdf faculty/major summary table layout.

import type { AdmissionMajorGroup } from '@/types/infographic';

interface Props {
    group: AdmissionMajorGroup;
    /** Optional style overrides from the properties panel */
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
}

export function FacultyHeader({
    group,
    fontSize = 14,
    color = '#1e3a5f',
    backgroundColor = '#dbeafe',
}: Props) {
    return (
        <div className="w-full h-full flex flex-col overflow-hidden rounded-sm" style={{ backgroundColor }}>
            {/* Title bar */}
            <div
                className="w-full text-white text-center font-bold py-2 px-4"
                style={{ backgroundColor: color, fontSize: fontSize + 2 }}
            >
                เกณฑ์การรับสมัครนักศึกษา หกดหด
            </div>
            <div
                className="w-full text-white text-center font-semibold py-1 px-4"
                style={{ backgroundColor: color, fontSize: fontSize - 1, borderTop: '1px solid rgba(255,255,255,0.3)' }}
            >
                โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT · รอบที่ 2 (ปีการศึกษา 2569)
            </div>

            {/* Faculty name */}
            <div
                className="w-full text-center font-bold py-2 px-4"
                style={{ color, fontSize: fontSize + 1, borderBottom: `2px solid ${color}` }}
            >
                {group.faculty}
            </div>

            {/* Major summary table */}
            <table className="w-full text-sm border-collapse flex-1" style={{ fontSize }}>
                <thead>
                    <tr style={{ backgroundColor: color, color: '#fff' }}>
                        <th className="border border-white px-2 py-1 text-left">สาขาวิชา</th>
                        <th className="border border-white px-2 py-1 text-center">จำนวนเรียกสอบคัดเลือก* (คน)</th>
                        <th className="border border-white px-2 py-1 text-center">จำนวนรับเข้าศึกษา (คน)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border px-2 py-1" style={{ borderColor: color }}>{group.admissionMajor}</td>
                        <td className="border px-2 py-1 text-center" style={{ borderColor: color }}>
                            {group.examTotal === 0 ? 'ทุกคนที่ผ่านเกณฑ์' : group.examTotal}
                        </td>
                        <td className="border px-2 py-1 text-center" style={{ borderColor: color }}>
                            {group.limitApplicant}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
