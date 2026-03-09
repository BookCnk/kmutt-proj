'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore, buildTOCEntries, groupByFaculty } from '@/stores/useEditorStore';
import { FacultyTOC, type FacultyTOCContent } from './FacultyTOC';
import { FacultySummaryPage } from './FacultySummaryPage';
import { MajorPage } from './MajorPage';

const A4_W = 794;
const A4_H = 1123;

const PAGE_STYLE: React.CSSProperties = {
    width: A4_W,
    height: A4_H,
    fontSize: 16,
    flexShrink: 0,
    backgroundColor: '#fff',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    position: 'relative',
};

interface A4CanvasProps {
    tocContent?: Partial<FacultyTOCContent>;
}

export function A4Canvas({ tocContent }: A4CanvasProps) {
    const { majorGroups, scrollTarget, scrollToFaculty } = useEditorStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
        if (!scrollTarget) return;

        if (scrollTarget === '__toc__') {
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const el = sectionRefs.current.get(scrollTarget);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        scrollToFaculty(null);
    }, [scrollTarget, scrollToFaculty]);

    if (majorGroups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-300 text-slate-400">
                <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-3 text-sm">อัปโหลดไฟล์ Excel เพื่อเริ่มสร้าง Infographic</p>
            </div>
        );
    }

    const tocEntries = buildTOCEntries(majorGroups);
    const faculties = groupByFaculty(majorGroups);

    return (
        <div ref={containerRef} className="overflow-y-auto h-full bg-slate-300" style={{ padding: '24px 0' }}>
            <div className="flex flex-col items-center gap-6">
                <div id="page-toc" data-a4-page="" style={PAGE_STYLE}>
                    <FacultyTOC data={{ entries: tocEntries }} content={tocContent} />
                </div>

                {(() => {
                    let pg = 2;
                    return faculties.map(({ faculty, majors }) => {
                        const summaryPg = pg++;
                        return (
                            <div
                                key={faculty}
                                ref={(el) => {
                                    if (el) sectionRefs.current.set(faculty, el);
                                }}
                                className="flex flex-col items-center gap-6"
                                id={`section-${faculty}`}
                            >
                                <div id={`page-${summaryPg}`} data-a4-page="" style={PAGE_STYLE}>
                                    <FacultySummaryPage faculty={faculty} majors={majors} pageNumber={summaryPg} />
                                </div>

                                {majors.map((group) => {
                                    const majorPg = pg++;
                                    return (
                                        <div key={group.admissionMajor} id={`page-${majorPg}`} data-a4-page="" style={PAGE_STYLE}>
                                            <MajorPage group={group} pageNumber={majorPg} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    });
                })()}

                <p className="text-xs text-slate-500 pb-4">
                    ทั้งหมด {majorGroups.length + faculties.length + 1} หน้า - A4 (210 x 297 mm)
                </p>
            </div>
        </div>
    );
}
