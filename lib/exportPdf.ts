// ─── Infographic CMS Builder — PDF Export ─────────────────────────────────────
// Captures the A4 canvas DOM node with html2canvas and outputs a jsPDF file.

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Captures an element by ID and saves it as an A4 PDF.
 * @param elementId - The DOM id of the A4 canvas wrapper div
 * @param filename  - Output filename (without .pdf extension)
 */
export async function exportCanvasToPDF(
    elementId: string,
    filename: string
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`exportCanvasToPDF: element #${elementId} not found`);
        return;
    }

    // Temporarily show scrollbars / overflow for full capture
    const prevOverflow = element.style.overflow;
    element.style.overflow = 'visible';

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();   // 210 mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

        // Fit image to A4, preserving aspect ratio
        const imgRatio = canvas.height / canvas.width;
        const imgHeightMm = pdfWidth * imgRatio;

        if (imgHeightMm <= pdfHeight) {
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm);
        } else {
            // Multi-page: slice the image into A4-height chunks
            const pageHeightPx = (canvas.width * pdfHeight) / pdfWidth;
            let offsetY = 0;
            let page = 0;
            while (offsetY < canvas.height) {
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = Math.min(pageHeightPx, canvas.height - offsetY);
                const ctx = sliceCanvas.getContext('2d')!;
                ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
                const sliceData = sliceCanvas.toDataURL('image/png');
                const sliceHeightMm = (sliceCanvas.height * pdfWidth) / canvas.width;
                if (page > 0) pdf.addPage();
                pdf.addImage(sliceData, 'PNG', 0, 0, pdfWidth, sliceHeightMm);
                offsetY += pageHeightPx;
                page++;
            }
        }

        pdf.save(`${filename}.pdf`);
    } finally {
        element.style.overflow = prevOverflow;
    }
}
