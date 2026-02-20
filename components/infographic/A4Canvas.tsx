'use client';

// ─── A4Canvas ─────────────────────────────────────────────────────────────────
// The centre A4-sized canvas area where infographic elements are placed.
// 794 × 1123 px ≈ A4 at 96 dpi (210 × 297 mm).

import { useEditorStore } from '@/stores/useEditorStore';
import { DraggableWrapper } from './DraggableWrapper';
import { FacultyHeader } from './FacultyHeader';
import { RequirementTable } from './RequirementTable';
import type { AdmissionMajorGroup, CanvasElement } from '@/types/infographic';

const A4_W = 794;
const A4_H = 1123;

function renderElementContent(el: CanvasElement) {
    if (el.type === 'faculty-header') {
        return (
            <FacultyHeader
                group={el.content as AdmissionMajorGroup}
                fontSize={el.styles.fontSize}
                color={el.styles.color}
                backgroundColor={el.styles.backgroundColor}
            />
        );
    }
    if (el.type === 'criteria-table') {
        return (
            <RequirementTable
                group={el.content as AdmissionMajorGroup}
                fontSize={el.styles.fontSize}
                color={el.styles.color}
                backgroundColor={el.styles.backgroundColor}
            />
        );
    }
    // text
    return (
        <div
            className="w-full h-full flex items-center px-2 overflow-hidden"
            style={{
                fontSize: el.styles.fontSize ?? 14,
                color: el.styles.color ?? '#1e293b',
                fontWeight: el.styles.fontWeight ?? 'normal',
                backgroundColor: el.styles.backgroundColor ?? 'transparent',
                textAlign: (el.styles.textAlign as any) ?? 'left',
            }}
        >
            {el.content as string}
        </div>
    );
}

export function A4Canvas() {
    const { canvasElements, selectedElementId, setSelectedElement } = useEditorStore();

    return (
        <div className="flex flex-col items-center gap-2 overflow-auto bg-slate-300 p-6 h-full">
            {/* Shadow wrapper so it looks like a physical page */}
            <div
                id="a4-canvas"
                className="relative bg-white shadow-2xl select-none"
                style={{ width: A4_W, height: A4_H, flexShrink: 0 }}
                onClick={(e) => {
                    // Deselect when clicking the blank canvas
                    if (e.target === e.currentTarget) setSelectedElement(null);
                }}
            >
                {canvasElements.map((el) => (
                    <DraggableWrapper
                        key={el.id}
                        element={el}
                        isSelected={el.id === selectedElementId}
                    >
                        {renderElementContent(el)}
                    </DraggableWrapper>
                ))}

                {canvasElements.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-3 text-sm">อัปโหลดไฟล์ Excel เพื่อเริ่มสร้าง Infographic</p>
                    </div>
                )}
            </div>

            <p className="text-xs text-slate-500 mt-1">A4 (210 × 297 mm) · 96 dpi</p>
        </div>
    );
}
