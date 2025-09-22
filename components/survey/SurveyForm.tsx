// components/survey/SurveyForm.tsx
"use client";

import { useMemo, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

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

import { createForm } from "@/api/formService";
import { baseSchema, type FormValues } from "./schema";
import { useFacultiesOptions } from "./hooks/useFacultiesOptions";
import { useDepartmentsOptions } from "./hooks/useDepartmentsOptions";
import { useProgramsOptions } from "./hooks/useProgramsOptions";
import { useAdmissionOption } from "./hooks/useAdmissionOption";

import type { IntakeConfig } from "./types";
import type { CreateFormDto, IntakeCalendar } from "@/types/form";

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Utils                                                              */
/* ------------------------------------------------------------------ */
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
  const bySort = [...list].sort(
    (a, b) => (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0)
  );
  const active = bySort.find((a) =>
    within(now, a.application_window?.open_at, a.application_window?.close_at)
  );
  const a = active ?? bySort[0];

  let status: "open" | "closing" | "closed" | "unknown" = "unknown";
  const s = Date.parse(a.application_window?.open_at ?? "");
  const e = Date.parse(a.application_window?.close_at ?? "");
  if (!Number.isNaN(s) && !Number.isNaN(e)) {
    if (now < s) status = "unknown";
    else if (now > e) status = "closed";
    else status = e - now <= 1000 * 60 * 60 * 48 ? "closing" : "open";
  }

  return {
    term: a.term?.label ?? "—",
    text: a.application_window?.notice || "ยังไม่ได้กรอกข้อความประกาศ",
    calendarUrl: a.application_window?.calendar_url || "#",
    status,
  };
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
type Props = {
  onSubmit?: (data: FormValues) => void;
  onBack?: () => void;
};

export default function SurveyForm({ onSubmit, onBack }: Props) {
  /* -------- Schema (เพิ่มกฎ domain/phone เหมือนเดิม) -------- */
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

  /* -------- Form -------- */
  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      faculty: "",
      department: "",
      programs: [], // << ใช้ array ของแถวโปรแกรม
      intakeModes: [], // << array ของโหมด
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

  /* -------- Watch (cascading selects) -------- */
  const facultyId = methods.watch("faculty");
  const departmentId = methods.watch("department");
  const intakeModeIds = methods.watch("intakeModes"); // string[]
  const programsRows = methods.watch("programs"); // { program, masters?, doctorals? }[]

  /* -------- Options loading -------- */
  const faculties = useFacultiesOptions();
  const departments = useDepartmentsOptions(facultyId || undefined);
  const programs = useProgramsOptions(departmentId || undefined);

  const admissions = useAdmissionOption();
  // (ยังไม่ได้ใช้ใน UI แต่คงไว้เพื่อไม่เปลี่ยน flow)
  const banner = useMemo(
    () => computeBannerFromAdmissions(admissions.data),
    [admissions.data]
  );

  /* -------- Rounds visibility (รองรับ array) -------- */
  const { showRounds, rounds } = useMemo(() => {
    const selected = new Set(intakeModeIds ?? []);
    if (selected.has("rounds")) {
      const cfg = intakeConfig.intakeModes.find(
        (m) => "rounds" in m && m.id === "rounds"
      ) as { rounds: string[] } | undefined;
      return { showRounds: true, rounds: cfg?.rounds ?? [] };
    }
    if (selected.has("monthly")) {
      const cfg = intakeConfig.intakeModes.find(
        (m) => "days" in m && m.id === "monthly"
      ) as { days: number[] } | undefined;
      return {
        showRounds: true,
        rounds: (cfg?.days ?? []).map((d) => `วันที่ ${d} ของทุกเดือน`),
      };
    }
    return { showRounds: false, rounds: [] as string[] };
  }, [intakeModeIds]);

  const normalizeId = (v: any): string => {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object")
      return String(v._id ?? v.id ?? v.value ?? v.code ?? "");
    return "";
  };

  /* -------- Submit -------- */
const handleSubmit = async (values: FormValues) => {
  setIsSubmitting(true);
  try {
    if (!Array.isArray(admissions?.data) || admissions.data.length === 0) {
      throw new Error("ข้อมูลประกาศรับสมัครยังไม่พร้อม กรุณาลองอีกครั้ง");
    }

    const firstProgramId = values.programs?.[0]?.program ?? "";
    if (!firstProgramId)
      throw new Error("กรุณาเลือกสาขาวิชาอย่างน้อย 1 รายการ");

    const admission = admissions.data[0];

    const selected = new Set(values.intakeModes ?? []);
    const intakeCalendar: IntakeCalendar = { rounds: [], monthly: [] };

    if (selected.has("rounds")) {
      intakeCalendar.rounds = (admission.rounds ?? []).map((r: any) => ({
        active: r.open ?? true,
        no: r.no,
        interview_date: r.interview_date,
      }));
    }
    if (selected.has("monthly")) {
      intakeCalendar.monthly = (admission.monthly ?? []).map((m: any) => ({
        active: m.open ?? true,
        month: String(m.month ?? ""),
        interview_date: m.interview_date,
      }));
    }

    const payload: CreateFormDto = {
      admission_id: String(admission._id),
      faculty_id: String(values.faculty),
      department_id: String(values.department),
      program_id: String(firstProgramId),
      intake_degree: {
        master: { amount: 30, bachelor_req: true },
        doctoral: { amount: 15, bachelor_req: true, master_req: true },
      },
      intake_calendar: intakeCalendar,
      submitter: {
        name: values.coordinator,
        phone: values.phone,
        email: values.email,
      },
      status: "received",
    };

    console.log("payload to API:", JSON.stringify(payload, null, 2));
    await createForm(payload);
    onSubmit?.(values);
    methods.reset();
  } finally {
    setIsSubmitting(false);
  }
};


  /* -------- UI -------- */
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
              onSubmit={methods.handleSubmit(handleSubmit, (errors) =>
                console.warn("RHForm errors:", errors)
              )}
              className="space-y-6">
              <FacultySelect
                name="faculty"
                options={faculties.data}
                loading={faculties.loading}
              />

              <DepartmentSelect
                name="department"
                facultySelected={!!facultyId}
                options={departments.data}
                loading={departments.loading}
              />

              {/* NOTE: ใช้ name="programs" ให้ตรงกับ schema */}
              <ProgramSelect
                name="programs"
                departmentSelected={!!departmentId}
                options={programs.data}
                loading={programs.loading}
              />

              <Separator />

              <IntakeModeRadios
                name="intakeModes" // array field
                admissions={admissions.data}
              />

              {/* <IntakeRoundSelect
                name="intakeRound"
                rounds={rounds}
                visible={showRounds}
              /> */}

              <Separator />

              <CoordinatorField name="coordinator" />
              <PhoneField name="phone" />
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
