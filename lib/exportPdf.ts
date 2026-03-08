// ─── Infographic CMS Builder — Multi-page PDF Export ─────────────────────────
// Captures every .a4-page element in document order and saves as one PDF.

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { getTHSarabunFontEmbedCSS } from './thsarabun-font-face';

const A4_W_MM = 210;
const A4_H_MM = 297;

type ExportProgress = {
    current: number;
    total: number;
    percent: number;
};

/**
 * Finds all elements matching selector (default: [data-a4-page]),
 * captures each with html-to-image, and saves as a single multi-page A4 PDF.
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
    let fontEmbedCSS: string | undefined;

    try {
        fontEmbedCSS = await getTHSarabunFontEmbedCSS();
    } catch (error) {
        console.warn('exportAllPagesToPDF: failed to embed THSarabun fonts', error);
    }

    for (let i = 0; i < totalPages; i++) {
        const el = pages[i];
        
        // Hide box shadow during capture if needed
        const prevBoxShadow = el.style.boxShadow;
        el.style.boxShadow = 'none';

        try {
            // html-to-image is much more accurate with web fonts (like THSarabun) 
            // because it uses the browser's native SVG rendering engine.
            const dataUrl = await toPng(el, {
                quality: 1.0,
                pixelRatio: 2, // 2x resolution
                backgroundColor: '#ffffff',
                cacheBust: true, // Prevent cached fonts/images from breaking
                fontEmbedCSS,
            });

            if (i > 0) pdf.addPage();
            // Keep every page pinned to the exact A4 frame
            pdf.addImage(dataUrl, 'PNG', 0, 0, A4_W_MM, A4_H_MM, undefined, 'FAST');
        } finally {
            el.style.boxShadow = prevBoxShadow;
        }

        onProgress?.({
            current: i + 1,
            total: totalPages,
            percent: Math.round(((i + 1) / totalPages) * 100),
        });
    }

    pdf.save(`${filename}.pdf`);
}
