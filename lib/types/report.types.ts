/**
 * TypeScript interfaces for the Admissions Report Generator
 * These types define the structure of the JSON data that will be used
 * to generate the PDF report.
 */

/**
 * Represents a single subject requirement or English test score
 */
export interface Requirement {
  /** The name of the subject (e.g., "Mathematics", "Physics") */
  subject: string;
  /** The condition or criteria (e.g., "Must pass", "Grade A minimum") */
  condition?: string;
  /** The required score or grade */
  score?: string | number;
}

/**
 * Represents an English language test requirement
 */
export interface EnglishTest {
  /** The name of the test (e.g., "TOEIC", "IELTS") */
  test: string;
  /** The condition or criteria */
  condition?: string;
  /** The minimum required score */
  score: string | number;
}

/**
 * Represents the qualification requirements for a specific applicant type
 */
export interface Qualification {
  /** The applicant type or subject group (e.g., "TGAT/TPAT", "Portfolio") */
  applicantType: string;
  /** List of subject requirements */
  requirements: Requirement[];
  /** List of English test requirements */
  englishTests: EnglishTest[];
}

/**
 * Represents a major/program with all its requirements
 */
export interface Major {
  /** Unique identifier for the major */
  id: string;
  /** The name of the major/program */
  name: string;
  /** The faculty that offers this major */
  faculty: string;
  /** The tuition fee or cost information */
  fee?: string | number;
  /** Number of students admitted */
  admitCount?: number;
  /** Additional notes or information about the major */
  notes?: string;
  /** Array of qualification requirements grouped by applicant type */
  qualifications: Qualification[];
}

/**
 * Type for the raw CSV row data
 * This represents the structure of each row in the uploaded CSV
 */
export interface CsvRow {
  /** The major name from CSV */
  "Major (Admission Major Mapping)": string;
  /** The subject group/applicant type */
  "Subject Group Map": string;
  /** The subject or test name */
  "Name": string;
  /** The faculty name */
  "Faculty"?: string;
  /** The fee information */
  "Fee"?: string;
  /** Number of admitted students */
  "Admit Count"?: string;
  /** Condition or criteria */
  "Condition"?: string;
  /** Score or grade requirement */
  "Score"?: string;
  /** Any additional fields from the CSV */
  [key: string]: string | undefined;
}
