// ─── Infographic CMS Builder — Multi-page PDF Export ─────────────────────────
// Captures every .a4-page element in document order and saves as one PDF.

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4_W_MM = 210;
const A4_H_MM = 297;

type ExportProgress = {
    current: number;
    total: number;
    percent: number;
};

/**
 * Finds all elements matching selector (default: [data-a4-page]),
 * captures each with html2canvas, and saves as a single multi-page A4 PDF.
 */
export async function exportAllPagesToPDF(
    filename: string,
    selector = '[data-a4-page]',
    onProgress?: (progress: ExportProgress) => void
): Promise<void> {
    const pages = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (pages.length === 0) {
        console.warn('exportAllPagesToPDF: no pages found with selector', selector);
        return;
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
        const el = pages[i];
        const prevOverflow = el.style.overflow;
        el.style.overflow = 'visible';

        try {
            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const imgRatioH = (canvas.height * A4_W_MM) / canvas.width;
            const imgH = Math.min(imgRatioH, A4_H_MM);

            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, A4_W_MM, imgH);
        } finally {
            el.style.overflow = prevOverflow;
        }

        onProgress?.({
            current: i + 1,
            total: totalPages,
            percent: Math.round(((i + 1) / totalPages) * 100),
        });
    }

    pdf.save(`${filename}.pdf`);
}
