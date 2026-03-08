'use client';

// ─── FacultyTOC ───────────────────────────────────────────────────────────────
// Renders the Table-of-Contents first page, listing all distinct faculties
// with dotted lines and page numbers — matching Criteria.pdf page 1.

import Image from 'next/image';
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
    // Date string like "11 พฤศจิกายน 2568"
    const dateStr = `ข้อมูล ณ วันที่ ${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

    return (
        <div className="w-full h-full flex flex-col bg-white font-sans" style={{ fontFamily: 'THSarabun, sans-serif', padding: '30px 40px', fontSize: 16 }}>

            {/* ── Top header bar ── */}
            <div className="flex items-stretch rounded-sm overflow-hidden" style={{ minHeight: 70, border: '1.5px solid #fa4616' }}>
                {/* Logo / title block */}
                <div className="flex items-center gap-4 px-4 py-2 bg-white" style={{ flex: '0 0 45%' }}>
                    {/* Official logo image */}
                    <div className="flex items-center pr-3 border-r border-slate-200">
                        <Image src="/ICON.png" alt="KMUTT 65" width={80} height={52} className="object-contain" priority />
                    </div>
                    {/* Title */}
                    <div className="text-slate-800 flex flex-col justify-center">
                        <div className="text-[13px] font-bold leading-tight">เกณฑ์การรับสมัครนักศึกษา</div>
                        <div className="text-[13px] font-bold leading-tight">รอบที่ 2 (ปีการศึกษา 2569)</div>
                    </div>
                </div>

                {/* Orange banner block */}
                <div
                    className="flex-1 flex items-center justify-center text-white font-bold text-sm px-6"
                    style={{ backgroundColor: '#fa4616', borderLeft: '1.5px solid #fa4616' }}
                >
                    โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex flex-col pt-16">

                {/* Section heading */}
                <h2 className="text-center font-bold mb-14" style={{ fontSize: 20, color: '#1e293b' }}>
                    คณะ/สถาบัน
                </h2>

                {/* TOC entries */}
                <div className="flex flex-col gap-5 px-6">
                    {data.entries.map((entry, i) => (
                        <div key={i} className="relative flex items-end w-full" style={{ fontSize: 16 }}>
                            {/* Faculty name with solid background to hide dots underneath */}
                            <div className="pr-2 bg-white relative z-10 shrink-0">
                                <span className="font-bold text-slate-800">{entry.faculty}</span>
                            </div>
                            
                            {/* The dotted line spanning the whole width underneath */}
                            <div 
                                className="absolute left-0 right-0 bottom-1.5 z-0" 
                                style={{ 
                                    borderBottom: '1.5px dotted #94a3b8',
                                    height: '1px'
                                }} 
                            />
                            
                            {/* Spacer to push the page number to the right */}
                            <div className="flex-1" />

                            {/* Page number with solid background to hide dots underneath */}
                            <div className="pl-2 bg-white relative z-10 shrink-0">
                                <span className="font-bold text-slate-800 tabular-nums">{entry.startPage}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="grid grid-cols-3 items-end pt-4 pb-2">
                {/* Left: squares + office name */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                        <div className="w-3.5 h-3.5" style={{ backgroundColor: '#fa4616' }} />
                        <div className="w-3.5 h-3.5" style={{ backgroundColor: '#fa4616' }} />
                        <div className="w-3.5 h-3.5 bg-slate-200" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">สำนักงานคัดเลือกและสรรหานักศึกษา มจธ.</span>
                </div>

                {/* Center: page number */}
                <div className="text-center text-[11px] text-slate-700 font-bold">
                    1 | P a g e
                </div>

                {/* Right: warning + date */}
                <div className="text-right flex flex-col items-end">
                    <div className="text-[10px] text-red-600 font-bold leading-tight">ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม</div>
                    <div className="text-[10px] text-red-600 font-bold leading-tight">{dateStr}</div>
                </div>
            </div>
        </div>
    );
}
