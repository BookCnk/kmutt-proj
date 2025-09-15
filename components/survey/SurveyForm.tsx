// components/survey/SurveyForm.tsx
"use client";

import { useMemo, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";

import { Separator } from "@/components/ui/separator";
import { Form } from "@/components/ui/form";

import AnnouncementBanner from "./AnnouncementBanner";
import WindowStatusAlert from "./WindowStatusAlert";
import SubmitBar from "./SubmitBar";

import FacultySelect from "./fields/FacultySelect";
import DepartmentSelect from "./fields/DepartmentSelect";
import ProgramSelect from "./fields/ProgramSelect";
import IntakeModeRadios from "./fields/IntakeModeRadios";
import IntakeRoundSelect from "./fields/IntakeRoundSelect";
import CoordinatorField from "./fields/CoordinatorField";
import PhoneField from "./fields/PhoneField";
import EmailField from "./fields/EmailField";

import { baseSchema, type FormValues } from "./schema";
import { useFacultiesOptions } from "./hooks/useFacultiesOptions";
import { useDepartmentsOptions } from "./hooks/useDepartmentsOptions";
import { useProgramsOptions } from "./hooks/useProgramsOptions";
import { useAdmissionOption } from "./hooks/useAdmissionOption";
import type { IntakeConfig } from "./types";

/** -------------------------------------------------------
 * คอนฟิก (ทำให้ self-contained ตามที่ขอ)
 * - สามารถย้ายไปไฟล์ config ภายหลังได้
 * ------------------------------------------------------ */
const intakeConfig: IntakeConfig = {
  term: "2/2568",
  announcementText:
    "การรับสมัครระดับบัณฑิตศึกษา ภาคการศึกษาที่ 2/2568 (เริ่ม ม.ค. 2569)",
  calendarUrl: "https://kmutt.me/Calendar-Postgraduate",
  status: "open",
  applyWindow: {
    start: "2025-07-01T00:00:00.000Z",
    end: "2025-11-25T16:59:59.000Z",
  },
  emailPolicy: {
    allowedDomains: ["mail.kmutt.ac.th", "kmutt.ac.th"],
  },
  intakeModes: [
    {
      id: "rounds",
      label: "ไม่เปิดรับสมัคร",
      rounds: ["รอบที่ 1", "รอบที่ 2", "รอบที่ 3"],
    },
    {
      id: "rounds",
      label: "สัมภาษณ์เป็นรอบ",
      rounds: ["รอบที่ 1", "รอบที่ 2", "รอบที่ 3"],
    },
    { id: "monthly", label: "สัมภาษณ์รายเดือน", days: [10, 20] },
  ],
};

// utils
function isWithinApplyWindow(startISO: string, endISO: string) {
  const now = Date.now();
  return now >= Date.parse(startISO) && now <= Date.parse(endISO);
}
const emailDomainAllowed = (email: string, domains: string[]) => {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return domains.some((d) => domain === d.toLowerCase());
};
const phoneLooksValid = (phone: string) =>
  /^[0-9+()\-.\s]{7,}$/.test(phone || "");

// props
type Props = {
  onSubmit?: (data: FormValues) => void;
  onBack?: () => void;
};

/* ---------------- Utils สำหรับ Banner ---------------- */
const within = (now: number, startISO?: string, endISO?: string) => {
  if (!startISO || !endISO) return false;
  const s = Date.parse(startISO);
  const e = Date.parse(endISO);
  if (Number.isNaN(s) || Number.isNaN(e)) return false;
  return now >= s && now <= e;
};

const computeBannerFromAdmissions = (list: any[]) => {
  if (!list?.length) {
    return {
      term: "—",
      text: "ยังไม่มีประกาศรับสมัคร",
      calendarUrl: "#",
      status: "unknown" as const,
    };
  }
  const now = Date.now();
  // เลือกอันที่กำลังเปิดรับวันนี้ก่อน ถ้าไม่มีใช้อันที่ term ใหม่สุด
  const bySort = [...list].sort(
    (a, b) => (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0)
  );
  const active = bySort.find((a) =>
    within(now, a.application_window?.open_at, a.application_window?.close_at)
  );
  const a = active ?? bySort[0];

  // คำนวณสถานะ
  let status: "open" | "closing" | "closed" | "unknown" = "unknown";
  const s = Date.parse(a.application_window?.open_at ?? "");
  const e = Date.parse(a.application_window?.close_at ?? "");
  if (!Number.isNaN(s) && !Number.isNaN(e)) {
    if (now < s) status = "unknown";
    else if (now > e) status = "closed";
    else {
      const leftMs = e - now;
      status = leftMs <= 1000 * 60 * 60 * 48 ? "closing" : "open"; // เหลือน้อยกว่า 48 ชม. = closing
    }
  }

  return {
    term: a.term?.label ?? "—",
    text: a.application_window?.notice || "ยังไม่ได้กรอกข้อความประกาศ",
    calendarUrl: a.application_window?.calendar_url || "#",
    status,
  };
};

export default function SurveyForm({ onSubmit, onBack }: Props) {
  // สร้าง schema runtime เพื่อเพิ่มกฎตาม config (email domain / phone)
  const schema = useMemo(
    () =>
      baseSchema.superRefine((data, ctx) => {
        if (!phoneLooksValid(data.phone)) {
          ctx.addIssue({
            path: ["phone"],
            code: z.ZodIssueCode.custom,
            message: "รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง",
          });
        }
        if (
          !emailDomainAllowed(
            data.email,
            intakeConfig.emailPolicy.allowedDomains
          )
        ) {
          ctx.addIssue({
            path: ["email"],
            code: z.ZodIssueCode.custom,
            message: `อีเมลต้องเป็นโดเมนที่อนุญาต: ${intakeConfig.emailPolicy.allowedDomains.join(
              ", "
            )}`,
          });
        }
      }),
    []
  );

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      faculty: "",
      department: "",
      program: "",
      intakeMode: "",
      intakeRound: "",
      coordinator: "",
      phone: "",
      email: "example@mail.kmutt.ac.th",
    },
    mode: "onTouched",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isWindowOpen = isWithinApplyWindow(
    intakeConfig.applyWindow.start,
    intakeConfig.applyWindow.end
  );

  // watch values for cascading selects
  const facultyId = methods.watch("faculty");
  const departmentId = methods.watch("department");
  const intakeModeId = methods.watch("intakeMode");

  // load options
  const faculties = useFacultiesOptions();
  const departments = useDepartmentsOptions(facultyId || undefined);
  const programs = useProgramsOptions(departmentId || undefined);
  const admissions = useAdmissionOption();
  const banner = useMemo(
    () => computeBannerFromAdmissions(admissions.data),
    [admissions.data]
  );

  // rounds availability
  const { showRounds, rounds } = useMemo(() => {
    const mode = intakeConfig.intakeModes.find((m) => m.id === intakeModeId);
    if (!mode) return { showRounds: false, rounds: [] as string[] };
    if ("rounds" in mode) return { showRounds: true, rounds: mode.rounds };
    if ("days" in mode) {
      return {
        showRounds: true,
        rounds: mode.days.map((d) => `วันที่ ${d} ของทุกเดือน`),
      };
    }
    return { showRounds: false, rounds: [] as string[] };
  }, [intakeModeId]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // ตัวอย่าง: รวม label ที่ผู้ใช้เลือกเพื่อส่งต่อ (ไม่ต้องพึ่ง mock)
      const facultyName =
        faculties.data.find((o) => o.value === values.faculty)?.label ??
        values.faculty;
      const departmentName =
        departments.data.find((d) => d.id === values.department)?.name ??
        values.department;
      const programName =
        programs.data.find((p) => p.id === values.program)?.name ??
        values.program;

      const payload: FormValues = {
        ...values,
        faculty: facultyName,
        department: departmentName,
        program: programName,
      };

      // simulate call
      await new Promise((r) => setTimeout(r, 1200));
      onSubmit?.(payload);
      methods.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AnnouncementBanner
        term={intakeConfig.term}
        text={intakeConfig.announcementText}
        calendarUrl={intakeConfig.calendarUrl}
        status={intakeConfig.status}
      />
      <WindowStatusAlert isOpen={isWindowOpen} />

      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            แบบสำรวจการคัดเลือกนักศึกษา
          </h2>
          <p className="text-gray-600">กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง</p>
        </div>

        <FormProvider {...methods}>
          <Form {...methods}>
            <form
              onSubmit={methods.handleSubmit(handleSubmit)}
              className="space-y-6">
              {/* Faculty */}
              <FacultySelect
                name="faculty"
                options={faculties.data}
                loading={faculties.loading}
              />

              {/* Department */}
              <DepartmentSelect
                name="department"
                facultySelected={!!facultyId}
                options={departments.data}
                loading={departments.loading}
              />

              {/* Program */}
              <ProgramSelect
                name="program"
                departmentSelected={!!departmentId}
                options={programs.data}
                loading={programs.loading}
              />

              <Separator />

              {/* Intake Mode */}
              <IntakeModeRadios
                name="intakeModes"
                admissions={admissions.data}
              />

              {/* Intake Round */}
              <IntakeRoundSelect
                name="intakeRound"
                rounds={rounds}
                visible={showRounds}
              />

              <Separator />

              {/* Coordinator */}
              <CoordinatorField name="coordinator" />
              {/* Phone */}
              <PhoneField name="phone" />
              {/* Email */}
              <EmailField name="email" />

              <SubmitBar
                onBack={onBack}
                isSubmitting={isSubmitting}
                disabled={!isWindowOpen}
              />
            </form>
          </Form>
        </FormProvider>
      </div>
    </div>
  );
}
