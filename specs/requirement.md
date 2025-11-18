# Specification: "Admissions Report Generator" (Client-Only Feature)

## 1. Feature Overview

This document outlines the specifications for the **"Admissions Report Generator"** feature, to be implemented as a client-side tool within the existing Next.js admin panel. This feature provides a workflow for administrators to upload a raw CSV, have the browser programmatically parse and structure the data, allow for in-browser editing, and generate the final PDF report directly from the browser.

## 2. User Stories

- **As an Admin,** I want to navigate to the `app/admin/export/report` page to access the new conversion tool.
- **As an Admin,** I want to upload a "Qualification Subject Group Mappings" CSV file directly into my browser.
- **As an Admin,** I want my browser to **automatically parse** this CSV, group all rows by major, and load the data into an in-page editor.
- **As an Admin,** I want to use this editor to manually correct any data, add notes, or fill in information that is _not_ in the CSV (the "human manual type" step).
- **As an Admin,** I want to see a live HTML preview of the final report as I make my edits.
- **As an Admin,** I want to click a "Generate PDF" button that uses my browser's print functionality to save this preview as a high-fidelity PDF file.

## 3. Functional Requirements

| ID            | Requirement                          | Description                                                                                                                                                                                                      |
| :------------ | :----------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F-SPEC-01** | **Client-Side File Parsing**         | The page must use a JavaScript library (like Papaparse) to read and parse the uploaded CSV file in the browser.                                                                                                  |
| **F-SPEC-02** | **Programmatic Data Transformation** | The browser-based JavaScript must execute a **hard-coded transformation logic** to group the flat CSV rows into a structured JSON (e.g., an array of `Major` objects, each with its own `qualifications` array). |
| **F-SPEC-03** | **In-Memory Data Store**             | The structured JSON must be stored in the page's React state (`useState`). This state will be the "single source of truth" for this session.                                                                     |
| **F-SPEC-04** | **In-Browser Data Editor**           | The UI must render the data from the React state into a series of forms, allowing the admin to edit any field (e.g., change fees, edit subject names, add notes). Changes will update the React state.           |
| **F-SPEC-05** | **Live HTML Preview**                | A component (`<ReportPreview>`) must render the current React state into an HTML view that visually matches the `02-R2-เกณฑ์ TGAT-TPAT-69.pdf` example.                                                          |
| **F-SPEC-06** | **Print-to-PDF Generation**          | A "Generate PDF" button must trigger the browser's `window.print()` function.                                                                                                                                    |
| **F-SPEC-07** | **Print Styling**                    | The page must include a dedicated print stylesheet (`@media print`) that hides all UI elements _except_ the `<ReportPreview>` component, ensuring the PDF output is clean.                                       |

## 4. Non-Functional Requirements

| ID             | Requirement               | Description                                                                                                                                                           |
| :------------- | :------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NF-SPEC-01** | **Data Persistence**      | Data is **non-persistent**. If the admin reloads the page, all uploaded and edited data will be lost. This is an accepted trade-off for the "serverless" requirement. |
| **NF-SPEC-02** | **Browser Compatibility** | The feature will rely on modern browser APIs (`FileReader`, `window.print()`). Compatibility will be focused on modern browsers (Chrome, Firefox, Edge).              |
| **NF-SPEC-03** | **High-Fidelity Output**  | The `@media print` CSS must be meticulously crafted to control page breaks (`page-break-after: always`) and formatting to ensure the PDF looks professional.          |
