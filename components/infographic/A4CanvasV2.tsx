'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore, groupByFaculty } from '@/stores/useEditorStore';
import { FacultyTOCv2, type FacultyTOCContent } from './FacultyTOCv2';
import { FacultySummaryPageV2 } from './FacultySummaryPageV2';
import { FacultyCriteriaTablePageV2 } from './FacultyCriteriaTablePageV2';
import { FacultyIntroPageV2 } from './FacultyIntroPageV2';
import { FacultyAdditionalPage1V2, FacultyAdditionalPage2V2 } from './FacultyAdditionalPageV2';

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

interface A4CanvasV2Props {
    tocContent?: Partial<FacultyTOCContent>;
}

// Helper to compute TOC entries (page numbers) for V2
function buildTOCEntriesV2(groups: any[]): { faculty: string; startPage: number }[] {
    const faculties = groupByFaculty(groups);
    let page = 2; // page 1 = TOC
    return faculties.map(({ faculty, majors }) => {
        const entry = { faculty, startPage: page };
        
        // Find unique subject group maps for this faculty
        const sgMaps = new Set<string>();
        for (const m of majors) {
            for (const c of m.criteria) {
                if (c.subjectGroupMap?.trim()) {
                    sgMaps.add(c.subjectGroupMap.trim());
                }
            }
        }
        
        const numCriteriaPages = sgMaps.size;
        let extraPages = 0;
        if (faculty.includes('วิศวกรรม')) {
            extraPages = 3; // 1 intro + 2 additional pages
        }
        
        page += 1 + numCriteriaPages + extraPages; // 1 summary page + N criteria pages + extraPages
        return entry;
    });
}

export function A4CanvasV2({ tocContent }: A4CanvasV2Props) {
    const { majorGroups, scrollTarget, scrollToFaculty, logoUrl, footerLogoUrl } = useEditorStore();
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
                <p className="mt-3 text-sm">อัปโหลดไฟล์ Excel เพื่อเริ่มสร้าง Infographic V2</p>
            </div>
        );
    }

    const tocEntries = buildTOCEntriesV2(majorGroups);
    const faculties = groupByFaculty(majorGroups);

    // Compute total page count
    let totalPages = 1; // 1 for TOC
    faculties.forEach(({ faculty, majors }) => {
        const sgMaps = new Set<string>();
        for (const m of majors) {
            for (const c of m.criteria) {
                if (c.subjectGroupMap?.trim()) {
                    sgMaps.add(c.subjectGroupMap.trim());
                }
            }
        }
        let extraPages = 0;
        if (faculty.includes('วิศวกรรม')) {
            extraPages = 3;
        }
        totalPages += 1 + sgMaps.size + extraPages;
    });

    return (
        <div ref={containerRef} className="overflow-y-auto h-full bg-slate-300" style={{ padding: '24px 0' }}>
            <div className="flex flex-col items-center gap-6">
                {/* Page 1: TOC */}
                <div id="page-toc" data-a4-page-v2="" style={PAGE_STYLE}>
                    <FacultyTOCv2 data={{ entries: tocEntries }} content={tocContent} logoUrl={logoUrl} footerLogoUrl={footerLogoUrl} />
                </div>

                {/* Faculty Pages */}
                {(() => {
                    let pg = 2;
                    return faculties.map(({ faculty, majors }) => {
                        const summaryPg = pg++;
                        const isEngineering = faculty.includes('วิศวกรรม');
                        const introPg = isEngineering ? pg++ : null;
                        
                        // Extract unique subjectGroupMap values for this faculty
                        const sgMaps = new Set<string>();
                        for (const m of majors) {
                            for (const c of m.criteria) {
                                if (c.subjectGroupMap?.trim()) {
                                    sgMaps.add(c.subjectGroupMap.trim());
                                }
                            }
                        }
                        const uniqueSgMaps = Array.from(sgMaps);

                        const criteriaPages = uniqueSgMaps.map((sgMap) => {
                            const criteriaPg = pg++;
                            return { sgMap, pageNum: criteriaPg };
                        });

                        const add1Pg = isEngineering ? pg++ : null;
                        const add2Pg = isEngineering ? pg++ : null;

                        return (
                            <div
                                key={faculty}
                                ref={(el) => {
                                    if (el) sectionRefs.current.set(faculty, el);
                                }}
                                className="flex flex-col items-center gap-6"
                                id={`section-${faculty}`}
                            >
                                {/* Faculty Summary Page */}
                                <div id={`page-${summaryPg}`} data-a4-page-v2="" style={PAGE_STYLE}>
                                    <FacultySummaryPageV2 faculty={faculty} majors={majors} pageNumber={summaryPg} logoUrl={logoUrl} footerLogoUrl={footerLogoUrl} />
                                </div>

                                {/* Engineering Intro Page (เงื่อนไขพิเศษ + 1. คุณสมบัติเบื้องต้นในการสมัคร) */}
                                {isEngineering && introPg && (
                                    <div id={`page-${introPg}`} data-a4-page-v2="" style={PAGE_STYLE}>
                                        <FacultyIntroPageV2 faculty={faculty} pageNumber={introPg} logoUrl={logoUrl} footerLogoUrl={footerLogoUrl} />
                                    </div>
                                )}

                                {/* Criteria Table Pages - 1 page per subjectGroupMap (2. เกณฑ์การพิจารณา) */}
                                {criteriaPages.map(({ sgMap, pageNum }) => (
                                    <div key={`${faculty}-${sgMap}`} id={`page-${pageNum}`} data-a4-page-v2="" style={PAGE_STYLE}>
                                        <FacultyCriteriaTablePageV2
                                            faculty={faculty}
                                            subjectGroupMap={sgMap}
                                            majors={majors}
                                            pageNumber={pageNum}
                                            logoUrl={logoUrl}
                                            footerLogoUrl={footerLogoUrl}
                                        />
                                    </div>
                                ))}

                                {/* Engineering Additional Page 1 (โครงการ Active Recruitment Table + 3. เกณฑ์รับสมัครเพิ่มเติม) */}
                                {isEngineering && add1Pg && (
                                    <div id={`page-${add1Pg}`} data-a4-page-v2="" style={PAGE_STYLE}>
                                        <FacultyAdditionalPage1V2 faculty={faculty} pageNumber={add1Pg} logoUrl={logoUrl} footerLogoUrl={footerLogoUrl} />
                                    </div>
                                )}

                                {/* Engineering Additional Page 2 (3.2 ต่อ + 3.3 - 3.5 + 4. คุณสมบัติเพิ่มเติมสำหรับหลักสูตรนานาชาติ) */}
                                {isEngineering && add2Pg && (
                                    <div id={`page-${add2Pg}`} data-a4-page-v2="" style={PAGE_STYLE}>
                                        <FacultyAdditionalPage2V2 faculty={faculty} pageNumber={add2Pg} logoUrl={logoUrl} footerLogoUrl={footerLogoUrl} />
                                    </div>
                                )}
                            </div>
                        );
                    });
                })()}

                <p className="text-xs text-slate-500 pb-4">
                    ทั้งหมด {totalPages} หน้า - A4 (210 x 297 mm)
                </p>
            </div>
        </div>
    );
}
