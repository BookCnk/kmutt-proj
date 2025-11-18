# Tasks: "Admissions Report Generator" (Client-Only Feature)

## Milestone 1: Setup & Excel Parsing

- [x] **[Frontend]** Create the new page file: `app/admin/export/report/page.tsx`. Mark it as `'use client'`.
- [x] **[Frontend]** Install xlsx library: `npm install xlsx && npm install --save-dev @types/xlsx`.
- [x] **[Frontend]** Create the `<XlsxUploader />` component and add the xlsx logic to read a file and store the raw row data in a parent state.
- [x] **[Database]** Define the TypeScript interfaces for the JSON structure (`Major`, `Qualification`, `Requirement`) in a new file, e.g., `lib/types/report.types.ts`.
- [x] **[Frontend]** Create the `lib/services/csvTransformService.ts` file (supports both Excel and CSV formats).
- [x] **[Frontend]** **(CRITICAL TASK)** Write the `transformCsvData` function. This involves:
  - [x] - Logic to group rows by Major.
  - [x] - Logic to group requirements by Applicant Type.
  - [x] - Logic to differentiate between "requirements" and "englishTests".
- [x] **[Frontend]** Add a `useEffect` hook to the main page that runs `transformCsvData` when the raw Excel data is set, storing the result in `structuredData` state.

## Milestone 2: Data Editor & Live Preview

- [x] **[Frontend]** Create the `<DataEditor />` component.
- [x] **[Frontend]** Pass the `structuredData` and `setStructuredData` state handlers to the editor.
- [x] **[Frontend]** Implement the editor UI (e.g., a simple JSON editor or basic forms) to allow manual overrides of the data.
- [x] **[Frontend]** Create the `<ReportPreview />` component.
- [x] **[Frontend]** Pass the `structuredData` state to the preview component.
- [x] **[Frontend/CSS]** Wrap the preview component in `<div id="report-preview">`.
- [x] **[Frontend/CSS]** Style the `<ReportPreview />` component with Tailwind to match the target PDF layout (fonts, tables, headings).
- [x] **[Frontend/CSS]** Add the `.report-major-section` class to the outer container of each major in the preview for page-break control.

## Milestone 3: PDF Generation & Styling

- [x] **[Frontend/CSS]** Create and import a global `styles/print.css` file.
- [x] **[Frontend/CSS]** Add the `@media print` rules to hide all admin UI (sidebar, header, uploader, editor).
- [x] **[Frontend/CSS]** Add `@media print` rules to make the `#report-preview` content fill the entire page.
- [x] **[Frontend/CSS]** Add the `page-break-after: always;` rule to the `.report-major-section` class within the print styles.
- [x] **[Frontend]** Add a "Generate PDF" button to the page.
- [x] **[Frontend]** Add an `onClick` handler to the button that calls `window.print()`.

## Milestone 4: Testing & Refinement

- [ ] **[Test]** Test the full, client-side flow: Upload CSV -> Verify data is structured correctly in the editor -> Make a test edit -> See edit reflected in preview.
- [ ] **[Test]** Click "Generate PDF" and check the browser's Print Preview dialog to ensure the layout is correct, all UI is hidden, and page breaks are working.
- [ ] **[Test]** Save the PDF and open the file to confirm fonts and styles are embedded correctly.
- [ ] **[Test]** Test with different browsers (Chrome, Firefox) to check for printing inconsistencies.
