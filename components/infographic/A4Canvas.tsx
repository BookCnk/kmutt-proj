'use client';

// ─── A4Canvas (multi-page scrollable) ─────────────────────────────────────────
// Shows ALL pages stacked vertically: TOC → faculty group 1 majors → group 2 → …
// Sidebar scrolls to a faculty section by name.

import { useEffect, useRef } from 'react';
import { useEditorStore, buildTOCEntries, groupByFaculty } from '@/stores/useEditorStore';
import { FacultyTOC } from './FacultyTOC';
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

export function A4Canvas() {
    const { majorGroups, scrollTarget, scrollToFaculty } = useEditorStore();
    const containerRef = useRef<HTMLDivElement>(null);
    // Map: faculty name → DOM ref for scrolling
    const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Scroll to faculty when scrollTarget changes
    useEffect(() => {
        if (!scrollTarget) return; // null = idle, nothing to do

        if (scrollTarget === '__toc__') {
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const el = sectionRefs.current.get(scrollTarget);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        // Reset to idle so the same target can be clicked again
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

    // Compute per-major page numbers (page 1 = TOC, page 2 = first major, …)
    let pageCounter = 2;
    const pageNumbers: number[] = majorGroups.map(() => pageCounter++);

    return (
        <div
            ref={containerRef}
            className="overflow-y-auto h-full bg-slate-300"
            style={{ padding: '24px 0' }}
        >
            <div className="flex flex-col items-center gap-6">

                {/* ── Page 1: Table of Contents ── */}
                <div id="page-toc" data-a4-page="" style={PAGE_STYLE}>
                    <FacultyTOC data={{ entries: tocEntries }} />
                </div>

                {/* ── Faculty groups: summary page then individual major pages ── */}
                {(() => {
                    let pg = 2; // page 1 = TOC, page 2 = first faculty summary
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
                                {/* Faculty summary page */}
                                <div id={`page-${summaryPg}`} data-a4-page="" style={PAGE_STYLE}>
                                    <FacultySummaryPage faculty={faculty} majors={majors} pageNumber={summaryPg} />
                                </div>

                                {/* Individual major pages */}
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
                    ทั้งหมด {majorGroups.length + faculties.length + 1} หน้า — A4 (210 × 297 mm)
                </p>
            </div>
        </div>
    );
}
