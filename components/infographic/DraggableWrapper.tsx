'use client';

// ─── DraggableWrapper ─────────────────────────────────────────────────────────
// Wraps any canvas element child with react-rnd for drag + resize.
// On every move/resize it syncs coordinates back to useEditorStore.

import { Rnd } from 'react-rnd';
import type { CanvasElement } from '@/types/infographic';
import { useEditorStore } from '@/stores/useEditorStore';

interface Props {
    element: CanvasElement;
    children: React.ReactNode;
    isSelected: boolean;
}

export function DraggableWrapper({ element, children, isSelected }: Props) {
    const { updateElementStyles, setSelectedElement, removeElement } = useEditorStore();

    return (
        <Rnd
            size={{ width: element.styles.width, height: element.styles.height }}
            position={{ x: element.styles.x, y: element.styles.y }}
            bounds="parent"
            onDragStop={(_e, d) => {
                updateElementStyles(element.id, { x: d.x, y: d.y });
            }}
            onResizeStop={(_e, _dir, ref, _delta, pos) => {
                updateElementStyles(element.id, {
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                    x: pos.x,
                    y: pos.y,
                });
            }}
            onClick={() => setSelectedElement(element.id)}
            style={{
                outline: isSelected ? '2px solid #3b82f6' : '1px dashed #cbd5e1',
                cursor: 'move',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            {/* Delete button visible only when selected */}
            {isSelected && (
                <button
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        removeElement(element.id);
                    }}
                    className="absolute top-0 right-0 z-50 bg-red-500 text-white text-xs px-1 rounded-bl"
                    style={{ lineHeight: 1.4 }}
                    title="ลบ element"
                >
                    ✕
                </button>
            )}
            {children}
        </Rnd>
    );
}
