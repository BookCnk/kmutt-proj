import api from "@/lib/api";

/**
 * Response type from backend conversion endpoint
 */
interface ConversionResponse {
  status: boolean;
  message: string;
  data: {
    filename: string;
    pdfBuffer: string; // base64-encoded PDF
    size: number;
    originalFilename: string;
  };
}

/**
 * Convert Excel buffer to PDF using backend conversion service
 * @param excelBuffer - ArrayBuffer containing Excel file data
 * @returns Promise<Blob> - PDF file as blob
 */
export const convertExcelToPdf = async (
  excelBuffer: ArrayBuffer
): Promise<Blob> => {
  // Create a Blob from the ArrayBuffer
  const excelBlob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Create FormData and append the file
  const formData = new FormData();
  formData.append("file", excelBlob, "document.xlsx");

  // Send request
  const response = await api.post<ConversionResponse>(
    "/convert/excel-to-pdf",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  // Extract base64 PDF from response
  if (!response.status || !response.data?.pdfBuffer) {
    throw new Error(response.message || "PDF conversion failed");
  }

  // Decode base64 to binary
  const base64Pdf = response.data.pdfBuffer;
  const binaryString = atob(base64Pdf);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create and return PDF Blob
  return new Blob([bytes], { type: "application/pdf" });
};
