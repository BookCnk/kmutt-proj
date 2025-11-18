import { Major, Qualification, Requirement, EnglishTest, CsvRow } from '@/lib/types/report.types';

/**
 * List of English test names to differentiate them from regular subject requirements
 */
const ENGLISH_TESTS = ['TOEIC', 'IELTS', 'TOEFL', 'CU-TEP', 'TU-GET'];

/**
 * Checks if a subject name is an English test
 */
function isEnglishTest(subjectName: string): boolean {
  return ENGLISH_TESTS.some(test =>
    subjectName.toUpperCase().includes(test.toUpperCase())
  );
}

/**
 * Transforms flat Excel/CSV data into a structured array of Major objects
 *
 * This function performs the following steps:
 * 1. Groups rows by Major
 * 2. Within each major, groups requirements by Applicant Type (Subject Group)
 * 3. Separates English tests from regular subject requirements
 *
 * @param csvRows - Array of parsed data rows (from Excel or CSV)
 * @returns Array of structured Major objects
 */
export function transformCsvData(csvRows: any[]): Major[] {
  // Step 1: Initialize a Map to store majors by their ID
  const majorsMap = new Map<string, Major>();

  // Step 2: Loop through each row in the data
  for (const row of csvRows) {
    // Step 3: Create a unique major ID from the data (using actual Excel column names)
    const majorId = row['Admission Major Mapping'];

    // Skip rows without a major ID
    if (!majorId) {
      console.warn('Skipping row without major ID:', row);
      continue;
    }

    // Step 4: If this major doesn't exist yet, create it
    if (!majorsMap.has(majorId)) {
      const newMajor: Major = {
        id: majorId,
        name: majorId,
        faculty: row['Faculty (Admission Major Mapping) (Admission Major Mapping)'] || '',
        fee: row['Fee rate total (Admission Major Mapping) (Admission Major Mapping)'],
        admitCount: row['จำนวนที่รับเข้าศึกษา (คน) (Admission Major Mapping) (Admission Major Mapping)'] ? parseInt(row['จำนวนที่รับเข้าศึกษา (คน) (Admission Major Mapping) (Admission Major Mapping)']) : undefined,
        notes: row['Notes'] || row['Additional Info'],
        qualifications: [],
      };
      majorsMap.set(majorId, newMajor);
    }

    // Step 5: Get the major object from the map
    const major = majorsMap.get(majorId)!;

    // Step 6: Find or create the correct qualification object based on applicant type
    const applicantType = row['Subject Group Map'] || 'General';
    let qualification = major.qualifications.find(q => q.applicantType === applicantType);

    if (!qualification) {
      qualification = {
        applicantType,
        requirements: [],
        englishTests: [],
      };
      major.qualifications.push(qualification);
    }

    // Step 7: Get subject/test information from the row
    const subjectName = row['Name'];

    // Skip if no subject name
    if (!subjectName) {
      continue;
    }

    const condition = row['Condition'];
    const score = row['GPA Min/Score'];

    // Step 8: Check if this is an English test
    if (isEnglishTest(subjectName)) {
      // Add to englishTests array
      const englishTest: EnglishTest = {
        test: subjectName,
        condition,
        score: score || '',
      };
      qualification.englishTests.push(englishTest);
    } else {
      // Step 9: Add to regular requirements array
      const requirement: Requirement = {
        subject: subjectName,
        condition,
        score,
      };
      qualification.requirements.push(requirement);
    }
  }

  // Step 10: Return array of all majors
  return Array.from(majorsMap.values());
}

/**
 * Validates the structure of Excel/CSV data before transformation
 *
 * @param csvRows - Array of parsed data rows (from Excel or CSV)
 * @returns Object with validation result and any error messages
 */
export function validateCsvData(csvRows: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!csvRows || csvRows.length === 0) {
    errors.push('Data file is empty');
    return { valid: false, errors };
  }

  // Check for required columns (using actual Excel column names)
  const requiredColumns = ['Admission Major Mapping', 'Subject Group Map', 'Name'];
  const firstRow = csvRows[0];

  for (const column of requiredColumns) {
    if (!(column in firstRow)) {
      errors.push(`Missing required column: ${column}`);
    }
  }

  // Check if there are any valid rows
  const validRows = csvRows.filter(row => row['Admission Major Mapping'] && row['Name']);
  if (validRows.length === 0) {
    errors.push('No valid data rows found (must have Admission Major Mapping and Name columns filled)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
