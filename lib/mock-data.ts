import { Faculty, SurveyRow, IntakeConfig, User } from "../types/types";

export const mockUser: User = {
  name: "Dr. Fasai Wongsaichon",
  email: "fasai.w@mail.kmutt.ac.th",
  avatar:
    "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
  initials: "F W",
  role: "USER",
};

export const intakeConfig: IntakeConfig = {
  term: "2/2568",
  applyWindow: {
    start: "2024-12-01T00:00:00Z",
    end: "2025-02-28T23:59:59Z",
  },
  calendarUrl: "https://calendar.google.com/calendar/u/0/r",
  emailPolicy: {
    allowedDomains: ["mail.kmutt.ac.th", "kmutt.ac.th"],
  },
  intakeModes: [
    { id: "none", label: "ไม่เปิดรับสมัคร" },
    {
      id: "batch",
      label: "สัมภาษณ์เป็นรอบ",
      rounds: ["2025-01-15", "2025-01-30", "2025-02-15"],
    },
    {
      id: "monthly",
      label: "สัมภาษณ์ทุกเดือน",
      days: [15, 30],
    },
  ],
  announcementText:
    "การรับสมัครนักศึกษา ภาคการศึกษาที่ 2/2568 เปิดรับสมัครตั้งแต่วันที่ 1 ธ.ค. 2567 - 28 ก.พ. 2568",
  status: "open",
};

export const faculties: Faculty[] = [
  {
    id: "eng",
    name: "คณะวิศวกรรมศาสตร์",
    departments: [
      {
        id: "cpe",
        name: "ภาควิชาวิศวกรรมคอมพิวเตอร์",
        programs: [
          {
            id: "cpe-bachelor",
            name: "วิศวกรรมศาสตรบัณฑิต (วิศวกรรมคอมพิวเตอร์)",
            open: true,
          },
          {
            id: "cpe-master",
            name: "วิศวกรรมศาสตรมหาบัณฑิต (วิศวกรรมคอมพิวเตอร์)",
            open: true,
          },
        ],
      },
      {
        id: "ee",
        name: "ภาควิชาวิศวกรรมไฟฟ้า",
        programs: [
          {
            id: "ee-bachelor",
            name: "วิศวกรรมศาสตรบัณฑิต (วิศวกรรมไฟฟ้า)",
            open: true,
          },
          {
            id: "ee-master",
            name: "วิศวกรรมศาสตรมหาบัณฑิต (วิศวกรรมไฟฟ้า)",
            open: false,
          },
        ],
      },
      {
        id: "me",
        name: "ภาควิชาวิศวกรรมเครื่องกล",
        programs: [
          {
            id: "me-bachelor",
            name: "วิศวกรรมศาสตรบัณฑิต (วิศวกรรมเครื่องกล)",
            open: true,
          },
        ],
      },
    ],
  },
  {
    id: "sci",
    name: "คณะวิทยาศาสตร์",
    departments: [
      {
        id: "math",
        name: "ภาควิชาคณิตศาสตร์",
        programs: [
          {
            id: "math-bachelor",
            name: "วิทยาศาสตรบัณฑิต (คณิตศาสตร์)",
            open: true,
          },
          {
            id: "math-master",
            name: "วิทยาศาสตรมหาบัณฑิต (คณิตศาสตร์)",
            open: true,
          },
        ],
      },
      {
        id: "chem",
        name: "ภาควิชาเคมี",
        programs: [
          { id: "chem-bachelor", name: "วิทยาศาสตรบัณฑิต (เคมี)", open: true },
        ],
      },
    ],
  },
  {
    id: "arch",
    name: "คณะสถาปัตยกรรมศาสตร์และการผังเมือง",
    departments: [
      {
        id: "arch",
        name: "ภาควิชาสถาปัตยกรรม",
        programs: [
          { id: "arch-bachelor", name: "สถาปัตยกรรมศาสตรบัณฑิต", open: true },
          { id: "arch-master", name: "สถาปัตยกรรมศาสตรมหาบัณฑิต", open: true },
        ],
      },
    ],
  },
];

// export const mockSurveyData: SurveyRow[] = [
//   {
//     id: "1",
//     faculty: "คณะวิศวกรรมศาสตร์",
//     department: "ภาควิชาวิศวกรรมคอมพิวเตอร์",
//     program: "วิศวกรรมศาสตรบัณฑิต (วิศวกรรมคอมพิวเตอร์)",
//     submitterName: "ผศ.ดร.สมชาย วิศวกร",
//     submitterEmail: "somchai.v@mail.kmutt.ac.th",
//     submittedAt: "2024-12-15T10:30:00Z",
//     coordinator: "ผศ.ดร.สมชาย วิศวกร",
//     phone: "02-470-8000",
//   },
//   {
//     id: "2",
//     faculty: "คณะวิศวกรรมศาสตร์",
//     department: "ภาควิชาวิศวกรรมไฟฟ้า",
//     program: "วิศวกรรมศาสตรบัณฑิต (วิศวกรรมไฟฟ้า)",
//     submitterName: "รศ.ดร.วิไล ไฟฟ้า",
//     submitterEmail: "wilai.f@mail.kmutt.ac.th",
//     submittedAt: "2024-12-14T14:20:00Z",
//     coordinator: "รศ.ดร.วิไล ไฟฟ้า",
//     phone: "02-470-8100",
//   },
//   {
//     id: "3",
//     faculty: "คณะวิทยาศาสตร์",
//     department: "ภาควิชาคณิตศาสตร์",
//     program: "วิทยาศาสตรบัณฑิต (คณิตศาสตร์)",
//     submitterName: "ผศ.ดร.นงลักษณ์ คณิต",
//     submitterEmail: "nonglak.m@mail.kmutt.ac.th",
//     submittedAt: "2024-12-13T09:15:00Z",
//     coordinator: "ผศ.ดร.นงลักษณ์ คณิต",
//     phone: "02-470-9000",
//   },
//   {
//     id: "4",
//     faculty: "คณะสถาปัตยกรรมศาสตร์และการผังเมือง",
//     department: "ภาควิชาสถาปัตยกรรม",
//     program: "สถาปัตยกรรมศาสตรบัณฑิต",
//     submitterName: "รศ.ดร.ประสิทธิ์ สถาปัตย์",
//     submitterEmail: "prasit.a@mail.kmutt.ac.th",
//     submittedAt: "2024-12-12T16:45:00Z",
//     coordinator: "รศ.ดร.ประสิทธิ์ สถาปัตย์",
//     phone: "02-470-9200",
//   },
//   {
//     id: "5",
//     faculty: "คณะวิศวกรรมศาสตร์",
//     department: "ภาควิชาวิศวกรรมเครื่องกล",
//     program: "วิศวกรรมศาสตรบัณฑิต (วิศวกรรมเครื่องกล)",
//     submitterName: "ผศ.ดร.อานนท์ เครื่องกล",
//     submitterEmail: "anon.m@mail.kmutt.ac.th",
//     submittedAt: "2024-12-11T11:30:00Z",
//     coordinator: "ผศ.ดร.อานนท์ เครื่องกล",
//     phone: "02-470-8200",
//   },
// ];
