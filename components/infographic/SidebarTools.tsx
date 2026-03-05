'use client';

// ─── SidebarTools (multi-page version) ────────────────────────────────────────
import { useRef, useState } from 'react';
import { useEditorStore, groupByFaculty } from '@/stores/useEditorStore';
import { parseExcelToGroups } from '@/lib/excelParser';

export function SidebarTools() {
    const { majorGroups, setMajorGroups, scrollToFaculty } = useEditorStore();
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
        } catch (err) {
            setError('ไม่สามารถอ่านไฟล์ Excel ได้');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const faculties = groupByFaculty(majorGroups);

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
            <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">เนื้อหา</p>
            </div>

            {/* Upload */}
            <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">อัปโหลด Input.xlsx</p>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full border-2 border-dashed border-blue-300 rounded-lg py-4 text-center text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-60"
                >
                    {loading ? 'กำลังอ่านข้อมูล…' : '📂 คลิกเพื่ออัปโหลดไฟล์'}
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                {majorGroups.length > 0 && (
                    <p className="mt-1 text-xs text-green-600">✓ {faculties.length} คณะ · {majorGroups.length} สาขาวิชา</p>
                )}
            </div>

            {/* TOC link */}
            {majorGroups.length > 0 && (
                <button
                    onClick={() => scrollToFaculty('__toc__')}
                    className="w-full text-left text-xs px-3 py-2 rounded font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
                >
                    📋 สารบัญ (หน้า 1)
                </button>
            )}

            {/* Faculty navigation */}
            {faculties.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">คณะ / สถาบัน</p>
                    <div className="flex flex-col gap-0.5">
                        {faculties.map(({ faculty }) => (
                            <button
                                key={faculty}
                                onClick={() => scrollToFaculty(faculty)}
                                className="w-full text-left text-xs px-2 py-2 rounded font-semibold text-slate-700 hover:bg-slate-100 transition-colors truncate"
                            >
                                {faculty}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
