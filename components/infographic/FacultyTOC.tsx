'use client';

// ─── FacultyTOC ───────────────────────────────────────────────────────────────
// Renders the Table-of-Contents first page, listing all distinct faculties
// with dotted lines and page numbers — matching Criteria.pdf page 1.

import type { FacultyTOCData } from '@/types/infographic';

interface Props {
    data: FacultyTOCData;
}

export function FacultyTOC({ data }: Props) {
    const today = new Date();
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];
    const dateStr = `ข้อมูล ณ วันที่ ${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

    return (
        <div className="w-full h-full flex flex-col bg-white font-sans" style={{ fontFamily: 'Sarabun, sans-serif', padding: '40px 60px 20px' }}>

            {/* ── Top header bar ── */}
            <div className="flex items-stretch border-b-2 border-orange-500" style={{ minHeight: 72 }}>
                {/* Logo / title block */}
                <div className="flex items-center gap-3 px-4 py-2" style={{ minWidth: 260 }}>
                    {/* KMUTT logo placeholder */}
                    <div className="flex items-center justify-center rounded" style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#b91c1c,#ea580c)' }}>
                        <span className="text-white font-black text-lg leading-none">K</span>
                    </div>
                    <div className="text-xs font-semibold leading-snug text-slate-800">
                        <div className="text-sm font-bold">เกณฑ์การรับสมัครนักศึกษา</div>
                        <div>รอบที่ 2 (ปีการศึกษา 2569)</div>
                    </div>
                </div>

                {/* Orange banner */}
                <div
                    className="flex-1 flex items-center justify-center text-white font-bold text-sm px-6"
                    style={{ backgroundColor: '#ea580c' }}
                >
                    โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex flex-col">

                {/* Section heading */}
                <h2 className="text-center font-bold mb-10" style={{ fontSize: 18, color: '#1e293b' }}>
                    คณะ/สถาบัน
                </h2>

                {/* TOC entries */}
                <div className="flex flex-col gap-3">
                    {data.entries.map((entry, i) => (
                        <div key={i} className="flex items-baseline gap-0" style={{ fontSize: 14 }}>
                            {/* Faculty name */}
                            <span className="shrink-0 text-slate-800">{entry.faculty}</span>
                            {/* Dotted leader */}
                            <span
                                className="flex-1 mx-1 overflow-hidden text-slate-400"
                                style={{
                                    borderBottom: '1px dotted #94a3b8',
                                    marginBottom: 3,
                                    minWidth: 40,
                                }}
                            />
                            {/* Page number */}
                            <span className="shrink-0 text-slate-800 tabular-nums">{entry.startPage}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-end justify-between px-8 py-3 border-t border-slate-200" style={{ minHeight: 52 }}>
                {/* Orange squares + office name */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#ea580c' }} />
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#fb923c' }} />
                    </div>
                    <span className="text-xs text-slate-600">สำนักงานคัดเลือกและสรรหานักศึกษา มจธ.</span>
                </div>

                {/* Date + page number */}
                <div className="text-right">
                    <div className="text-xs text-orange-600 font-semibold">{dateStr}</div>
                    <div className="text-xs text-slate-500 mt-0.5">1 | Page</div>
                </div>
            </div>
        </div>
    );
}
