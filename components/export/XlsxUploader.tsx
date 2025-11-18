'use client';

import { useCallback } from 'react';
import * as XLSX from 'xlsx';

interface XlsxUploaderProps {
  onXlsxLoaded: (data: any[]) => void;
}

export default function XlsxUploader({ onXlsxLoaded }: XlsxUploaderProps) {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      // Check file extension
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        alert('Please upload an Excel file (.xlsx or .xls).');
        return;
      }

      // Read the file
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            alert('Failed to read file.');
            return;
          }

          // Parse the Excel file
          const workbook = XLSX.read(data, { type: 'binary' });

          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON (array of objects with headers)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Use first row as header
            defval: '', // Default value for empty cells
          });

          if (jsonData.length === 0) {
            alert('The Excel file is empty.');
            return;
          }

          // Convert array of arrays to array of objects
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          if (rows.length === 0) {
            alert('No data rows found in the Excel file.');
            return;
          }

          console.log('Excel data loaded:', rows);
          console.log('Headers:', headers);
          onXlsxLoaded(rows);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          alert('Failed to parse Excel file. Please check the file format.');
        }
      };

      reader.onerror = () => {
        console.error('Error reading file');
        alert('Failed to read the file.');
      };

      reader.readAsBinaryString(file);
    },
    [onXlsxLoaded]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="xlsx-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Excel file (.xlsx or .xls) - Qualification Subject Group Mappings</p>
          </div>
          <input
            id="xlsx-upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div className="text-sm text-gray-600">
        <p className="font-semibold mb-1">Expected Excel Format:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>First row must contain headers (column names)</li>
          <li>Headers should include: Major (Admission Major Mapping), Subject Group Map, Name, etc.</li>
          <li>Each row represents a subject requirement for a major</li>
          <li>The Excel file will be automatically parsed and structured</li>
        </ul>
      </div>
    </div>
  );
}
