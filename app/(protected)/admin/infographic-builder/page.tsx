'use client';

// ─── Infographic Builder Page ─────────────────────────────────────────────────
// Route: /admin/infographic-builder  (inside the (protected) layout)
// 3-column layout: SidebarTools | scrollable multi-page A4Canvas | PropertiesPanel removed

import { useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { exportAllPagesToPDF } from '@/lib/exportPdf';
import { SidebarTools } from '@/components/infographic/SidebarTools';
import { A4Canvas } from '@/components/infographic/A4Canvas';

export default function InfographicBuilderPage() {
    const { majorGroups } = useEditorStore();
    const [exporting, setExporting] = useState(false);

    async function handleExport() {
        setExporting(true);
        try {
            await exportAllPagesToPDF('KMUTT-Infographic-2569');
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden -mx-4 -my-8">

            {/* ── Top toolbar ── */}
            <div className="flex items-center justify-between bg-white border-b px-4 py-2 shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-base font-bold text-slate-800">🗂️ Infographic Builder</h1>
                    {majorGroups.length > 0 && (
                        <p className="text-xs text-slate-500">
                            {majorGroups.length + 1} หน้า (สารบัญ + {majorGroups.length} สาขาวิชา)
                        </p>
                    )}
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting || majorGroups.length === 0}
                    className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
                >
                    {exporting ? 'กำลัง Export…' : '⬇ Export PDF ทั้งหมด'}
                </button>
            </div>

            {/* ── 2-column layout: sidebar + canvas ── */}
            <div className="flex flex-1 overflow-hidden">

                <aside className="w-64 flex-shrink-0 bg-white border-r overflow-y-auto p-3">
                    <SidebarTools />
                </aside>

                <main className="flex-1 overflow-hidden">
                    <A4Canvas />
                </main>

            </div>
        </div>
    );
}
