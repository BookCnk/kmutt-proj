'use client';

import { useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { exportAllPagesToPDF } from '@/lib/exportPdf';
import { SidebarTools } from '@/components/infographic/SidebarTools';
import { A4Canvas } from '@/components/infographic/A4Canvas';

export default function InfographicBuilderPage() {
    const { majorGroups } = useEditorStore();
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState({
        current: 0,
        total: 0,
        percent: 0,
    });

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

    return (
        <div className="relative flex flex-col h-[calc(100vh-64px)] overflow-hidden -mx-4 -my-8">
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
                    <A4Canvas />
                </main>
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
                        <p className="mt-2 text-right text-xs font-medium" style={{ color: '#fa4616' }}>{exportProgress.percent}%</p>
                    </div>
                </div>
            )}
        </div>
    );
}
