'use client';

import { useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { exportAllPagesToPDF } from '@/lib/exportPdf';
import { SidebarTools } from '@/components/infographic/SidebarTools';
import { A4Canvas } from '@/components/infographic/A4Canvas';
import {
    DEFAULT_FACULTY_TOC_CONTENT,
    type FacultyTOCContent,
} from '@/components/infographic/FacultyTOC';

export default function InfographicBuilderPage() {
    const { majorGroups } = useEditorStore();
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState({
        current: 0,
        total: 0,
        percent: 0,
    });
    const [tocContent, setTocContent] = useState<FacultyTOCContent>(
        DEFAULT_FACULTY_TOC_CONTENT
    );

    async function handleExport() {
        setExporting(true);
        setExportProgress({ current: 0, total: 0, percent: 0 });

        try {
            await exportAllPagesToPDF('KMUTT-Infographic-2569', '[data-a4-page]', (progress) => {
                setExportProgress(progress);
            });
        } finally {
            setExporting(false);
        }
    }

    function updateTocField(field: keyof FacultyTOCContent, value: string) {
        setTocContent((prev) => ({ ...prev, [field]: value }));
    }

    return (
        <div
            className="relative flex flex-col h-[calc(100vh-64px)] overflow-hidden -my-8"
            style={{
                width: '100vw',
                marginLeft: 'calc(50% - 50vw)',
                marginRight: 'calc(50% - 50vw)',
            }}
        >
            <div className="flex items-center justify-between bg-white border-b px-4 py-2 shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-base font-bold text-slate-800">Infographic Builder</h1>
                    {majorGroups.length > 0 && (
                        <p className="text-xs text-slate-500">
                            {majorGroups.length + 1} หน้า (สารบัญ + {majorGroups.length} คณะ)
                        </p>
                    )}
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting || majorGroups.length === 0}
                    className="text-xs px-4 py-1.5 text-white rounded disabled:opacity-50 transition-colors font-semibold"
                    style={{ backgroundColor: '#fa4616' }}
                >
                    {exporting ? `กำลัง Export ${exportProgress.percent}%` : 'Export PDF ทั้งหมด'}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 flex-shrink-0 bg-white border-r overflow-y-auto p-3">
                    <SidebarTools />
                </aside>

                <main className="flex-1 overflow-hidden">
                    <A4Canvas tocContent={tocContent} />
                </main>

                <aside className="w-80 flex-shrink-0 bg-white border-l overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-slate-800">แก้ไขหน้าแรก (TOC)</h2>
                        <button
                            type="button"
                            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                            onClick={() => setTocContent(DEFAULT_FACULTY_TOC_CONTENT)}
                        >
                            Reset
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">หัวข้อซ้าย บรรทัด 1</label>
                            <input
                                className="w-full text-sm rounded border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                value={tocContent.leftTitleLine1}
                                onChange={(e) => updateTocField('leftTitleLine1', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">หัวข้อซ้าย บรรทัด 2</label>
                            <input
                                className="w-full text-sm rounded border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                value={tocContent.leftTitleLine2}
                                onChange={(e) => updateTocField('leftTitleLine2', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">ข้อความแถบส้ม</label>
                            <textarea
                                className="w-full text-sm rounded border border-slate-300 px-2 py-1.5 min-h-16 resize-y focus:outline-none focus:ring-2 focus:ring-orange-200"
                                value={tocContent.bannerText}
                                onChange={(e) => updateTocField('bannerText', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">หัวข้อกลางหน้า</label>
                            <input
                                className="w-full text-sm rounded border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                value={tocContent.sectionTitle}
                                onChange={(e) => updateTocField('sectionTitle', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อหน่วยงานฟุตเตอร์</label>
                            <textarea
                                className="w-full text-sm rounded border border-slate-300 px-2 py-1.5 min-h-16 resize-y focus:outline-none focus:ring-2 focus:ring-orange-200"
                                value={tocContent.officeName}
                                onChange={(e) => updateTocField('officeName', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">ข้อความคำเตือน</label>
                            <input
                                className="w-full text-sm rounded border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                value={tocContent.warningText}
                                onChange={(e) => updateTocField('warningText', e.target.value)}
                            />
                        </div>
                    </div>
                </aside>
            </div>

            {exporting && (
                <div className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 p-5">
                        <p className="text-sm font-semibold text-slate-800">กำลังสร้างไฟล์ PDF...</p>
                        <p className="text-xs text-slate-500 mt-1">
                            หน้า {exportProgress.current}/{exportProgress.total || majorGroups.length + 1}
                        </p>
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div
                                className="h-full transition-[width] duration-200"
                                style={{ width: `${exportProgress.percent}%`, backgroundColor: '#fa4616' }}
                            />
                        </div>
                        <p className="mt-2 text-right text-xs font-medium" style={{ color: '#fa4616' }}>
                            {exportProgress.percent}%
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
