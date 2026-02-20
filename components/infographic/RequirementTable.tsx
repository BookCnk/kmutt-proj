'use client';

// ─── RequirementTable ─────────────────────────────────────────────────────────
// Renders the admission criteria table for a major, matching Criteria.pdf.
// Columns: รายการ | เกรดเฉลี่ย/คะแนนขั้นต่ำ | ค่าน้ำหนักเรียกสอบ (%) | ค่าน้ำหนักรับเข้า (%)

import type { AdmissionMajorGroup, AdmissionCriteriaRow } from '@/types/infographic';

interface Props {
    group: AdmissionMajorGroup;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
}

function getMinScore(row: AdmissionCriteriaRow): string {
    if (row.gpaMin !== null) return String(row.gpaMin);
    if (row.lngScore !== null) return String(row.lngScore);
    return 'ไม่กำหนดขั้นต่ำ';
}

export function RequirementTable({
    group,
    fontSize = 11,
    color = '#1e3a5f',
    backgroundColor = '#ffffff',
}: Props) {
    // De-duplicate criteria rows by (subjectName, gpaMin, weightTest, weightAdmission)
    // to avoid showing the same criterion multiple times from multi-condition subject groups
    const seen = new Set<string>();
    const uniqueCriteria = group.criteria.filter((r) => {
        const key = `${r.subjectName}|${r.gpaMin}|${r.weightTest}|${r.weightAdmission}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const thStyle: React.CSSProperties = {
        backgroundColor: color,
        color: '#fff',
        border: `1px solid ${color}`,
        padding: '4px 6px',
        textAlign: 'center',
        fontSize,
    };
    const tdStyle: React.CSSProperties = {
        border: `1px solid ${color}`,
        padding: '3px 6px',
        fontSize,
        backgroundColor,
    };

    // Total rows
    const totalTest = uniqueCriteria.reduce((s, r) => s + (r.weightTest ?? 0), 0);
    const totalAdmission = uniqueCriteria.reduce((s, r) => s + (r.weightAdmission ?? 0), 0);

    return (
        <div className="w-full h-full overflow-auto" style={{ backgroundColor }}>
            <table className="w-full border-collapse" style={{ fontSize }}>
                <thead>
                    <tr>
                        <th colSpan={2} style={thStyle}>รายการ</th>
                        <th style={thStyle}>เกรดเฉลี่ย / คะแนนขั้นต่ำ</th>
                        <th colSpan={2} style={{ ...thStyle, backgroundColor: '#1d4ed8' }}>
                            เกณฑ์การรับสมัคร / เกณฑ์การเรียกสอบคัดเลือก
                        </th>
                        <th colSpan={2} style={{ ...thStyle, backgroundColor: '#0f766e' }}>
                            เกณฑ์การรับเข้าศึกษา
                        </th>
                    </tr>
                    <tr>
                        <th style={thStyle} />
                        <th style={thStyle}>ชื่อรายการ</th>
                        <th style={thStyle} />
                        <th style={{ ...thStyle, backgroundColor: '#1d4ed8' }}>ค่าน้ำหนัก (%)</th>
                        <th style={{ ...thStyle, backgroundColor: '#1d4ed8' }}>เงื่อนไข</th>
                        <th style={{ ...thStyle, backgroundColor: '#0f766e' }}>ค่าน้ำหนัก (%)</th>
                        <th style={{ ...thStyle, backgroundColor: '#0f766e' }}>หมายเหตุ</th>
                    </tr>
                </thead>
                <tbody>
                    {uniqueCriteria.map((row, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? backgroundColor : '#f8fafc' }}>
                            <td style={{ ...tdStyle, textAlign: 'center', width: 28 }}>{i + 1}</td>
                            <td style={tdStyle}>{row.subjectName}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{getMinScore(row)}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                {row.weightTest !== null ? row.weightTest : '-'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{row.condition || '-'}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                {row.weightAdmission !== null ? row.weightAdmission : '-'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                {row.configPercent ? 'บังคับ' : ''}
                            </td>
                        </tr>
                    ))}
                    {/* Total row */}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                        <td colSpan={3} style={{ ...tdStyle, textAlign: 'right' }}>รวม</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{totalTest || '-'}</td>
                        <td style={tdStyle} />
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{totalAdmission || '-'}</td>
                        <td style={tdStyle} />
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
