'use client';

// ─── SidebarTools ─────────────────────────────────────────────────────────────
// Left sidebar for the infographic builder.
// Handles: Excel file upload, major group selector, Add Text Block button.

import { useRef, useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { parseExcelToGroups } from '@/lib/excelParser';
import type { CanvasElement } from '@/types/infographic';

export function SidebarTools() {
    const {
        majorGroups,
        selectedGroupIndex,
        setMajorGroups,
        setSelectedGroup,
        loadGroupToCanvas,
        addElement,
    } = useEditorStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const groups = await parseExcelToGroups(file);
            setMajorGroups(groups);
            if (groups.length > 0) loadGroupToCanvas(groups[0]);
        } catch (err) {
            setError('ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleSelectGroup(index: number) {
        setSelectedGroup(index);
        loadGroupToCanvas(majorGroups[index]);
    }

    function handleAddText() {
        const el: CanvasElement = {
            id: `text-${Date.now()}`,
            type: 'text',
            content: 'คลิกแล้วแก้ไขข้อความ',
            styles: { x: 40, y: 40, width: 300, height: 48, fontSize: 14, color: '#1e293b' },
        };
        addElement(el);
    }

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
            {/* Header */}
            <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">เครื่องมือ</p>
            </div>

            {/* Excel upload zone */}
            <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">อัปโหลด Input.xlsx</p>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full border-2 border-dashed border-blue-300 rounded-lg py-4 text-center text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-60"
                >
                    {loading ? 'กำลังอ่านข้อมูล…' : '📂 คลิกเพื่ออัปโหลดไฟล์'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                {majorGroups.length > 0 && (
                    <p className="mt-1 text-xs text-green-600">✓ พบ {majorGroups.length} สาขาวิชา</p>
                )}
            </div>

            {/* Major group selector */}
            {majorGroups.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">เลือกสาขาวิชา</p>
                    <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
                        {majorGroups.map((g, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelectGroup(i)}
                                className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${i === selectedGroupIndex
                                        ? 'bg-blue-600 text-white font-semibold'
                                        : 'hover:bg-slate-100 text-slate-700'
                                    }`}
                            >
                                <span className="block font-semibold truncate">{g.faculty}</span>
                                <span className="block truncate opacity-80">{g.admissionMajor}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <hr className="border-slate-200" />

            {/* Add element buttons */}
            <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">เพิ่ม Element</p>
                <button
                    onClick={handleAddText}
                    className="w-full text-left text-sm bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded transition-colors"
                >
                    🔤 เพิ่มกล่องข้อความ
                </button>
            </div>
        </div>
    );
}
