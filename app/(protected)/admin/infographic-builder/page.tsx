'use client';

// ─── Infographic Builder Page ─────────────────────────────────────────────────
// Route: /admin/infographic-builder  (inside the (protected) layout)
// 3-column WYSIWYG layout: SidebarTools | A4Canvas | PropertiesPanel

import { useEditorStore } from '@/stores/useEditorStore';
import { exportCanvasToPDF } from '@/lib/exportPdf';
import { SidebarTools } from '@/components/infographic/SidebarTools';
import { A4Canvas } from '@/components/infographic/A4Canvas';
import { PropertiesPanel } from '@/components/infographic/PropertiesPanel';
import { useState } from 'react';

export default function InfographicBuilderPage() {
    const { majorGroups, selectedGroupIndex, clearCanvas } = useEditorStore();
    const [exporting, setExporting] = useState(false);

    const currentGroup = majorGroups[selectedGroupIndex];

    async function handleExport() {
        setExporting(true);
        const filename = currentGroup
            ? `${currentGroup.faculty} - ${currentGroup.admissionMajor}`.replace(/[/\\?%*:|"<>]/g, '-')
            : 'infographic';
        await exportCanvasToPDF('a4-canvas', filename);
        setExporting(false);
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden -mx-4 -my-8">

            {/* ── Top toolbar ── */}
            <div className="flex items-center justify-between bg-white border-b px-4 py-2 shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-base font-bold text-slate-800">🗂️ Infographic Builder</h1>
                    {currentGroup && (
                        <p className="text-xs text-slate-500">{currentGroup.faculty} › {currentGroup.admissionMajor}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={clearCanvas}
                        className="text-xs px-3 py-1.5 border rounded hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        🗑 ล้างหน้ากระดาษ
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting || !currentGroup}
                        className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
                    >
                        {exporting ? 'กำลัง Export…' : '⬇ Export PDF'}
                    </button>
                </div>
            </div>

            {/* ── 3-column layout ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left sidebar */}
                <aside className="w-64 flex-shrink-0 bg-white border-r overflow-y-auto p-3">
                    <SidebarTools />
                </aside>

                {/* Centre canvas (takes all remaining space, scrollable) */}
                <main className="flex-1 overflow-hidden">
                    <A4Canvas />
                </main>

                {/* Right sidebar */}
                <aside className="w-64 flex-shrink-0 bg-white border-l overflow-y-auto p-3">
                    <PropertiesPanel />
                </aside>

            </div>
        </div>
    );
}
