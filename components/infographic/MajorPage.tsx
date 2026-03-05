'use client';

// ─── MajorPage ─────────────────────────────────────────────────────────────────
// A complete self-contained A4 page for one admission major.
// Matches the per-major page layout of Criteria.pdf.

import type { AdmissionCriteriaRow, AdmissionMajorGroup } from '@/types/infographic';

interface Props {
    group: AdmissionMajorGroup;
    pageNumber: number;
}

function getMinScore(row: AdmissionCriteriaRow): string {
    if (row.gpaMin !== null) return String(row.gpaMin);
    if (row.lngScore !== null) return String(row.lngScore);
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

const ACCENT = '#ea580c';
const DARK = '#1e3a5f';

export function MajorPage({ group, pageNumber }: Props) {
    const today = new Date();
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const dateStr = `ข้อมูล ณ วันที่ ${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

    const criteria = dedup(group.criteria);
    const totalTest = criteria.reduce((s, r) => s + (r.weightTest ?? 0), 0);
    const totalAdmission = criteria.reduce((s, r) => s + (r.weightAdmission ?? 0), 0);

    // Credit requirements — unique by subjectGroupMap
    const creditRows = Array.from(
        new Map(
            criteria
                .filter((r) => r.subjectGroupMap && r.credits != null)
                .map((r) => [r.subjectGroupMap.trim(), r])
        ).values()
    );

    const thStyle: React.CSSProperties = {
        backgroundColor: DARK, color: '#fff', border: `1px solid ${DARK}`,
        padding: '3px 6px', textAlign: 'center', fontSize: 10,
    };
    const tdStyle: React.CSSProperties = {
        border: `1px solid ${DARK}`, padding: '3px 6px', fontSize: 10,
    };

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden" style={{ fontFamily: 'Sarabun, sans-serif', padding: '40px 60px 20px' }}>

            {/* ── Top header bar ── */}
            <div className="flex items-stretch border-b-2" style={{ borderColor: ACCENT, minHeight: 64 }}>
                <div className="flex items-center gap-2 px-4 py-1" style={{ minWidth: 230 }}>
                    <div className="flex items-center justify-center rounded" style={{ width: 44, height: 44, background: `linear-gradient(135deg,#b91c1c,${ACCENT})` }}>
                        <span className="text-white font-black text-base leading-none">K</span>
                    </div>
                    <div className="text-xs leading-snug text-slate-800">
                        <div className="font-bold" style={{ fontSize: 11 }}>เกณฑ์การรับสมัครนักศึกษา</div>
                        <div style={{ fontSize: 10 }}>รอบที่ 2 (ปีการศึกษา 2569)</div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center text-white font-bold px-4"
                    style={{ backgroundColor: ACCENT, fontSize: 12 }}>
                    โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">

                {/* Faculty name */}
                <div className="font-bold text-center" style={{ fontSize: 15, color: DARK }}>
                    {group.faculty}
                </div>

                {/* Major summary table */}
                <table className="w-full border-collapse" style={{ fontSize: 11 }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, textAlign: 'left' }}>สาขาวิชา</th>
                            <th style={thStyle}>จำนวนเรียกสอบคัดเลือก* (คน)</th>
                            <th style={thStyle}>จำนวนรับเข้าศึกษา (คน)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={tdStyle}>{group.admissionMajor}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                {group.examTotal === 0 ? 'ทุกคนที่ผ่านเกณฑ์' : group.examTotal}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{group.limitApplicant}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Credit requirements (if any) */}
                {creditRows.length > 0 && (
                    <table className="w-full border-collapse" style={{ fontSize: 10 }}>
                        <thead>
                            <tr>
                                <th colSpan={2} style={thStyle}>หน่วยกิตรวมของกลุ่มสาระการเรียนรู้</th>
                                <th style={thStyle}>หน่วยกิตขั้นต่ำ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditRows.map((r, i) => (
                                <tr key={i}>
                                    <td colSpan={2} style={tdStyle}>{r.subjectGroupMap.trim()}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{r.credits}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Criteria table */}
                <table className="w-full border-collapse" style={{ fontSize: 10 }}>
                    <thead>
                        <tr>
                            <th colSpan={2} style={thStyle}>รายการ</th>
                            <th style={thStyle}>เกรดเฉลี่ย / คะแนนขั้นต่ำ</th>
                            <th colSpan={2} style={{ ...thStyle, backgroundColor: '#1d4ed8' }}>เกณฑ์การรับสมัคร / เรียกสอบ</th>
                            <th colSpan={2} style={{ ...thStyle, backgroundColor: '#0f766e' }}>เกณฑ์การรับเข้าศึกษา</th>
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
                        {criteria.map((row, i) => (
                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ ...tdStyle, textAlign: 'center', width: 20 }}>{i + 1}</td>
                                <td style={tdStyle}>{row.subjectName}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{getMinScore(row)}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{row.weightTest ?? '-'}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{row.condition || '-'}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{row.weightAdmission ?? '-'}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{row.configPercent ? 'บังคับ' : ''}</td>
                            </tr>
                        ))}
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

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-8 py-2 border-t border-slate-200" style={{ fontSize: 9 }}>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ACCENT }} />
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#fb923c' }} />
                    </div>
                    <span className="text-slate-600">สำนักงานคัดเลือกและสรรหานักศึกษา มจธ. ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม</span>
                </div>
                <div className="text-right">
                    <div className="text-orange-600 font-semibold">{dateStr}</div>
                    <div className="text-slate-500">{pageNumber} | Page</div>
                </div>
            </div>
        </div>
    );
}
