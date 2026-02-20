'use client';

// ─── PropertiesPanel ──────────────────────────────────────────────────────────
// Right sidebar: edit styles of the selected canvas element.

import { useEditorStore } from '@/stores/useEditorStore';

export function PropertiesPanel() {
    const { canvasElements, selectedElementId, updateElement, updateElementStyles } = useEditorStore();

    const selected = canvasElements.find((el) => el.id === selectedElementId);

    if (!selected) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center px-2">
                <span className="text-2xl mb-2">🖱️</span>
                คลิกที่ element บนหน้ากระดาษเพื่อแก้ไขคุณสมบัติ
            </div>
        );
    }

    function handleStyleChange(key: string, value: string | number) {
        const parsed = typeof value === 'string' && !isNaN(Number(value)) && value !== '' ? Number(value) : value;
        updateElementStyles(selected!.id, { [key]: parsed } as any);
    }

    return (
        <div className="flex flex-col gap-4 overflow-y-auto h-full">
            <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">คุณสมบัติ</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">[{selected.type}] {selected.id}</p>
            </div>

            {/* Text content — only for text elements */}
            {selected.type === 'text' && (
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-600">ข้อความ</span>
                    <textarea
                        className="border rounded px-2 py-1 text-sm resize-none"
                        rows={3}
                        value={selected.content as string}
                        onChange={(e) => updateElement(selected.id, { content: e.target.value })}
                    />
                </label>
            )}

            {/* Font size */}
            <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">ขนาดตัวอักษร (px)</span>
                <input
                    type="number"
                    className="border rounded px-2 py-1 text-sm"
                    value={selected.styles.fontSize ?? 14}
                    min={8}
                    max={72}
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                />
            </label>

            {/* Text color */}
            <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">สีข้อความ / สี Header</span>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        className="h-8 w-10 rounded border cursor-pointer"
                        value={selected.styles.color ?? '#1e3a5f'}
                        onChange={(e) => handleStyleChange('color', e.target.value)}
                    />
                    <input
                        type="text"
                        className="flex-1 border rounded px-2 py-1 text-sm font-mono"
                        value={selected.styles.color ?? '#1e3a5f'}
                        onChange={(e) => handleStyleChange('color', e.target.value)}
                    />
                </div>
            </label>

            {/* Background color */}
            <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">สีพื้นหลัง</span>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        className="h-8 w-10 rounded border cursor-pointer"
                        value={selected.styles.backgroundColor ?? '#ffffff'}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    />
                    <input
                        type="text"
                        className="flex-1 border rounded px-2 py-1 text-sm font-mono"
                        value={selected.styles.backgroundColor ?? '#ffffff'}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    />
                </div>
            </label>

            {/* Font weight */}
            <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">น้ำหนักตัวอักษร</span>
                <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selected.styles.fontWeight ?? 'normal'}
                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                >
                    <option value="normal">ปกติ</option>
                    <option value="semibold">กึ่งหนา</option>
                    <option value="bold">หนา</option>
                </select>
            </label>

            {/* Position & size read-only display */}
            <div className="border-t pt-3 mt-auto">
                <p className="text-xs font-semibold text-slate-600 mb-1">ตำแหน่ง / ขนาด</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                    <span>X: {Math.round(selected.styles.x)}</span>
                    <span>Y: {Math.round(selected.styles.y)}</span>
                    <span>W: {Math.round(selected.styles.width)}</span>
                    <span>H: {Math.round(selected.styles.height)}</span>
                </div>
            </div>
        </div>
    );
}
