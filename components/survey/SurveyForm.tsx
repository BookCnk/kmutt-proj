"use client";

import { useMemo, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

import AnnouncementBanner from "./AnnouncementBanner";
import WindowStatusAlert from "./WindowStatusAlert";
import SubmitBar from "./SubmitBar";

import FacultySelect from "./fields/FacultySelect";
import DepartmentSelect from "./fields/DepartmentSelect";
import ProgramSelect from "./fields/ProgramSelect";
import IntakeModeRadios from "./fields/IntakeModeRadios";
// import IntakeRoundSelect from "./fields/IntakeRoundSelect";
import CoordinatorField from "./fields/CoordinatorField";
import PhonesField from "./fields/PhoneField";
import EmailField from "./fields/EmailField";

import { createForm } from "@/api/formService";
import { useAuthStore } from "@/stores/auth";
import { getAuthUser } from "@/utils/storage";

import { baseSchema, type FormValues } from "./schema";
import { useFacultiesOptions } from "./hooks/useFacultiesOptions";
import { useDepartmentsOptions } from "./hooks/useDepartmentsOptions";
import { useProgramsOptions } from "./hooks/useProgramsOptions";
import { useAdmissionOption } from "./hooks/useAdmissionOption";

import type { IntakeConfig } from "./types";
import type { CreateFormPayloadV2, IntakeCalendar } from "@/types/form";

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
    allowedDomains: ["gmail.com", "mail.kmutt.ac.th"],
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
  /* -------- Auth: user_id สำหรับแนบไปให้หลังบ้าน -------- */
  const authUser = useAuthStore((s) => s.user);
  const emailFromStorage = getAuthUser()?.email ?? undefined;
  const initialEmail =
    authUser?.email ?? emailFromStorage ?? "example@mail.kmutt.ac.th";
  const fallbackUserId =
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem("user") || "{}")?.id;
          } catch {
            return undefined;
          }
        })()
      : undefined;
  const currentUserId = authUser?.id ?? fallbackUserId;

  /* -------- Schema (เพิ่มกฎ domain/phone) -------- */
  const schema = useMemo(
    () =>
      baseSchema.superRefine((data, ctx) => {
        // ตรวจทุกเบอร์ใน array
        (data.phone ?? []).forEach((p: any, i: any) => {
          if (!/^[0-9+()\-.\s]{7,}$/.test(p || "")) {
            ctx.addIssue({
              path: ["phone", i],
              code: z.ZodIssueCode.custom,
              message: "รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง",
            });
          }
        });

        // ตรวจ domain email ตามเดิม...
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
      programs: [], // array ของแถวโปรแกรม
      intakeModes: [], // array ของโหมด
      intakeRound: "",
      coordinator: "",
      phones: [""],
      email: initialEmail || "",
      intake_calendar: { rounds: [], monthly: [] },
    } as any,
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

  /* -------- Options loading -------- */
  const faculties = useFacultiesOptions();
  const departments = useDepartmentsOptions(facultyId || undefined);
  const programs = useProgramsOptions(departmentId || undefined);

  const admissions = useAdmissionOption();
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
      if (!currentUserId)
        throw new Error("ยังไม่ได้เข้าสู่ระบบ (ไม่พบ user_id)");
      if (!Array.isArray(admissions?.data) || admissions.data.length === 0)
        throw new Error("ข้อมูลประกาศรับสมัครยังไม่พร้อม กรุณาลองอีกครั้ง");
      if (!Array.isArray(values.programs) || values.programs.length === 0)
        throw new Error("กรุณาเลือกสาขาวิชาอย่างน้อย 1 รายการ");

      const admission = admissions.data[0];

      // ✅ ดึงค่าที่ IntakeModeRadios ซิงก์ไว้แบบ raw (ไม่ผ่าน Zod)
      const calendarRaw = (methods.getValues("intake_calendar") ?? {}) as {
        rounds?: Array<{ no?: number; interview_date?: string }>;
        monthly?: Array<{
          month?: string | number;
          interview_date?: string;
        }>;
      };

      const pickedRoundsSrc = Array.isArray(calendarRaw.rounds)
        ? calendarRaw.rounds
        : [];
      const pickedMonthlySrc = Array.isArray(calendarRaw.monthly)
        ? calendarRaw.monthly
        : [];

      // map -> เหลือฟิลด์ขั้นต่ำ
      const pickedRounds = pickedRoundsSrc
        .filter((r) => r && r.interview_date)
        .map((r) => ({
          no: Number(r.no ?? 0),
          interview_date: new Date(String(r.interview_date)).toISOString(),
        }));

      const pickedMonthly = pickedMonthlySrc
        .filter((m) => m && m.interview_date)
        .map((m) => ({
          ...(m.month !== undefined ? { month: m.month } : {}),
          interview_date: new Date(String(m.interview_date)).toISOString(),
        }));

      // 2) map โปรแกรมที่เลือก -> intake_programs[] (เลิก hardcode)
      const intake_programs = (values.programs as any[]).map((row) => {
        const program_id = String(normalizeId(row.program));

        const intake_degree: any = {};
        if (typeof row.masters === "number" && !Number.isNaN(row.masters)) {
          intake_degree.master = {
            amount: row.masters,
            bachelor_req: !!row.master_bachelor_req,
          };
        }
        if (typeof row.doctorals === "number" && !Number.isNaN(row.doctorals)) {
          intake_degree.doctoral = {
            amount: row.doctorals,
            bachelor_req: !!row.doctoral_bachelor_req,
            master_req: !!row.doctoral_master_req,
          };
        }

        return {
          program_id,
          intake_degree,
          intake_calendar: {
            rounds: pickedRounds,
            monthly: pickedMonthly,
          } as IntakeCalendar,
        };
      });

      // 3) payload V2
      const payload: CreateFormPayloadV2 = {
        admission_id: String(admission._id),
        faculty_id: String(values.faculty),
        department_id: String(values.department),
        intake_programs,
        submitter: {
          name: values.coordinator,
          phone: (values.phone ?? []).map((s) => s.trim()).filter(Boolean),
          email: values.email,
        },
        status: "received",
      };

      await createForm(payload);
      toast.success("ส่งแบบสำเร็จ");
      onSubmit?.(values);
      methods.reset();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "ส่งแบบไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------- UI -------- */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ถ้าต้องการโชว์ banner จาก admissions จริง ให้เปลี่ยน props มาใช้ 'banner' ที่คำนวณไว้ */}
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

              {/* ใช้ name="programs" ให้ตรงกับ schema */}
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

              <Separator />

              <CoordinatorField name="coordinator" />
              <PhonesField name="phone" />
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
