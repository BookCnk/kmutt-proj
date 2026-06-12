# Infographics PDF V2 (Active Recruitment) - Status Report

This report summarizes what is currently implemented, what is missing, and the readiness of the Excel data extraction for version 2 (Active Recruitment) of the PDF export feature.

---

## 1. Excel Data Extraction Recheck

We have verified the data inside [Active Qualification Subject Group Mapping.xlsx](file:///c:/Users/Admin/Desktop/KMUTT%204th/KMUTT%20JOB/kmutt-proj/resources/Active%20Qualification%20Subject%20Group%20Mapping.xlsx). The data extraction is **ready and complete**. All variables required to generate both summary pages and detail pages are present in the Excel columns:

*   **Admission Counts (เดิม vs ใหม่):**
    *   **ม.6 หรือเทียบเท่า / หลักสูตรตามอัธยาศัย:** Parsed from Column 28 (`จำนวนที่รับเข้าศึกษา (คน)`) and Column 29 (`จำนวนเรียกเข้าสอบสัมภาษณ์`). These correspond to the "ใหม่" (new) columns in the PDF tables.
    *   **เดิม (original counts):** These are not directly in the Excel file. They are entered manually in the UI by the user using inline inputs and saved in the Zustand store (`oldAdmissionCounts`).
*   **Credit Requirements:**
    *   Parsed from Column 11 (`Credits`). For example, in mathematics majors, we see math credits (`Credits: 8`), science credits (`Credits: 20`), and foreign language credits (`Credits: 1`) mapped correctly.
*   **Admission Criteria (GPAX / GPA / Exam scores):**
    *   Minimum grades are parsed from Column 6 (`GPA Min/Score`).
    *   Weights are parsed from Column 10 (`% น้ำหนักรับเข้าศึกษา` / `weightAdmission`).
    *   Subjects/Criteria names (e.g. GPAX, GPA คณิตศาสตร์, GPA วิทยาศาสตร์, สอบสัมภาษณ์, แฟ้มสะสมผลงาน) are parsed from Column 4 (`Name`).
    *   Application groups (e.g., ม.6, กศน, พระปริยัติธรรม) are parsed from Column 3 (`Subject Group Map`).

The current parser ([excelParser.ts](file:///c:/Users/Admin/Desktop/KMUTT%204th/KMUTT%20JOB/kmutt-proj/lib/excelParser.ts)) successfully reads all of these fields into the store.

---

## 2. What Is Done (Implemented)

The foundational features and the specific layout for **Faculty of Engineering** are largely complete:

1.  **PDF Version Toggle & Route Selection:**
    *   Implemented in [page.tsx](file:///c:/Users/Admin/Desktop/KMUTT%204th/KMUTT%20JOB/kmutt-proj/app/%28protected%29/admin/infographic-builder/page.tsx) and [useEditorStore.ts](file:///c:/Users/Admin/Desktop/KMUTT%204th/KMUTT%20JOB/kmutt-proj/stores/useEditorStore.ts).
    *   Users can switch between **V1 (Infographic)** and **V2 (Active Recruitment PDF)** in the sidebar tools.
    *   Exporting PDF uses the correct selector (`[data-a4-page-v2]`) when V2 is active, ensuring only V2 pages are captured.
2.  **Table of Contents (Page 1):**
    *   [FacultyTOCv2.tsx](file:///c:/Users/Admin/Desktop/KMUTT%204th/KMUTT%20JOB/kmutt-proj/components/infographic/FacultyTOCv2.tsx) handles V2 layout styling, calculating start page numbers dynamically.
3.  **Faculty of Engineering V2 Pages (Pages 2-8):**
    *   **Summary Page (Page 2):** Lists all engineering majors with editable inline inputs for "เดิม" counts. It highlights changed values (bold text) when they differ.
    *   **Intro Page (Page 3):** Special conditions (color blindness rules) and general qualifications are rendered.
    *   **Horizontal Criteria Tables (Pages 4-6):** Rendered dynamically per `subjectGroupMap` group (e.g., Group 1, Group 2, Group 3).
    *   **Additional Criteria Pages (Pages 7-8):** Hardcoded templates for portfolio criteria, CEFR/SAT rules, and department-specific requirements.

---

## 3. What Is NOT Done (Missing)

The main gap is formatting the page layout for **non-Engineering faculties** to match the target PDF:

1.  **Detail Pages per Major (Non-Engineering):**
    *   In the target PDF, faculties like **Science (วิทยาศาสตร์)**, **Industrial Education (ครุศาสตร์อุตสาหกรรมฯ)**, and **Interdisciplinary Studies (สหวิทยาการ)** do not use a consolidated horizontal table.
    *   Instead, they have **one dedicated detail page per major** (or group of majors in a department) which contains:
        *   A **vertical criteria table** (e.g., listing GPAX, GPA Math, GPA Science, Interview, Portfolio as rows, with columns for minimum grade and weight %).
        *   General qualification bullets (ม.6, กศน, etc.).
        *   Minimum credit requirements table (Math, Sci, English credits).
        *   Specific remarks/notes.
    *   *Current State:* The code renders a horizontal criteria table (`FacultyCriteriaTablePageV2`) for all other faculties, which is a major layout discrepancy.
2.  **Faculty-Specific Layout Exceptions:**
    *   **FIBO (Robotics):** FIBO has only 1 major and has **no summary page** in the PDF. It goes straight to the detailed page (Page 37).
    *   **SoA+D (Architecture):** Has a summary page (Page 30), a combined criteria table listing all 6 majors (Page 31), and two special qualification pages (Pages 32, 33). It does not have individual detail pages.
    *   *Current State:* The canvas renders FIBO and Architecture with the default summary + horizontal tables behavior, ignoring these special rules.
3.  **Credit Requirements Rendering:**
    *   The credit limits (e.g., Math >= 8, Sci >= 20, English >= 6) are parsed from Excel but are not dynamically displayed in a visual table on the detail pages.
4.  **Aesthetic and Border Styling:**
    *   The target PDF uses strong, solid black borders (`border: 1.5px solid #000`) for all tables. The current HTML styling has some preflight border overrides from Tailwind that make borders look faint or inconsistent.
