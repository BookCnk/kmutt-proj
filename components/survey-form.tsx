"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectContentSimple,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { FormData } from "@/types/types";
import { faculties, intakeConfig, mockUser } from "@/lib/mock-data";
import {
  formatPhone,
  isWithinApplyWindow,
  validateEmail,
  validatePhone,
} from "@/lib/utils/validation";

import { getFaculties } from "@/api/facultyService";
import { getDepartmentsByFaculty } from "@/api/departmentService";
import { getProgramsByDepartment } from "@/api/programService";

// -----------------------------------------------------------------------------
// Types & Schemas
// -----------------------------------------------------------------------------
type Option = { value: string; label: string };

const formSchema = z.object({
  faculty: z.string().min(1, "กรุณาเลือกคณะ"),
  department: z.string().min(1, "กรุณาเลือกภาควิชา/สาขาวิชา"),
  program: z.string().min(1, "กรุณาเลือกสาขาวิชา"),
  intakeMode: z.string().min(1, "กรุณาเลือกรูปแบบการรับสมัคร"),
  intakeRound: z.string().optional(),
  coordinator: z.string().min(1, "กรุณากรอกชื่อผู้ประสานงาน"),
  phone: z.string().min(1, "กรุณากรอกหมายเลขโทรศัพท์").refine(validatePhone, {
    message: "รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง",
  }),
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .refine(
      (email) => validateEmail(email, intakeConfig.emailPolicy.allowedDomains),
      {
        message: `อีเมลต้องเป็นโดเมนที่อนุญาต: ${intakeConfig.emailPolicy.allowedDomains.join(
          ", "
        )}`,
      }
    ),
});

interface SurveyFormProps {
  onSubmit?: (data: FormData) => void;
  onBack?: () => void;
}

export function SurveyForm({ onSubmit, onBack }: SurveyFormProps) {
  // ---------------------------------------------------------------------------
  // Loading / Options (Faculty)
  // ---------------------------------------------------------------------------
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list: any = await getFaculties();
        setOptions(
          list.data.map((f: any) => ({
            value: String(f._id),
            label: f.title,
          }))
        );
      } catch (err) {
        console.error("getFaculties error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      faculty: "",
      department: "",
      program: "",
      intakeMode: "",
      intakeRound: "",
      coordinator: "",
      phone: "",
      email: mockUser.email,
    },
  });

  const watchedFaculty = form.watch("faculty");
  const watchedDepartment = form.watch("department");
  const watchedIntakeMode = form.watch("intakeMode");

  // ---------------------------------------------------------------------------
  // Derived flags
  // ---------------------------------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isWindowOpen = isWithinApplyWindow(
    intakeConfig.applyWindow.start,
    intakeConfig.applyWindow.end
  );

  // ---------------------------------------------------------------------------
  // Department & Program states
  // ---------------------------------------------------------------------------
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [progLoading, setProgLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Intake rounds UI states
  // ---------------------------------------------------------------------------
  const [showIntakeRounds, setShowIntakeRounds] = useState(false);
  const [availableRounds, setAvailableRounds] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // Effects: Load Departments by Faculty
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    // reset child fields on faculty change
    form.setValue("department", "");
    form.setValue("program", "");
    setAvailablePrograms([]);

    if (!watchedFaculty) {
      setAvailableDepartments([]);
      return;
    }

    const loadDepartments = async () => {
      setDeptLoading(true);
      try {
        const res = await getDepartmentsByFaculty(String(watchedFaculty)); // DepartmentResponse
        if (cancelled) return;

        const mapped = (res.data ?? []).map((d: any) => ({
          id: String(d._id),
          name: d.title,
        }));
        setAvailableDepartments(mapped);
      } catch (err) {
        console.error("getDepartmentsByFaculty error:", err);
        if (!cancelled) setAvailableDepartments([]);
      } finally {
        if (!cancelled) setDeptLoading(false);
      }
    };

    loadDepartments();
    return () => {
      cancelled = true;
    };
  }, [watchedFaculty, form]);

  // ---------------------------------------------------------------------------
  // Effects: Load Programs by Department
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    form.setValue("program", "");
    setAvailablePrograms([]);

    if (!watchedDepartment) return;

    const load = async () => {
      setProgLoading(true);
      try {
        const res = await getProgramsByDepartment(String(watchedDepartment)); // ProgramResponse
        if (cancelled) return;

        const mapped =
          (res?.data ?? []).map((p: any) => ({
            id: String(p._id),
            name: p.title,
            open: !!p.active,
          })) || [];

        setAvailablePrograms(mapped);
      } catch (err) {
        console.error("getProgramsByDepartment error:", err);
        if (!cancelled) setAvailablePrograms([]);
      } finally {
        if (!cancelled) setProgLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [watchedDepartment, form]);

  // ---------------------------------------------------------------------------
  // Effects: Intake mode → rounds
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (watchedIntakeMode) {
      const intakeMode = intakeConfig.intakeModes.find(
        (m) => m.id === watchedIntakeMode
      );

      if (intakeMode && "rounds" in intakeMode) {
        setShowIntakeRounds(true);
        setAvailableRounds(intakeMode.rounds);
      } else if (intakeMode && "days" in intakeMode) {
        setShowIntakeRounds(true);
        setAvailableRounds(
          intakeMode.days.map((d) => `วันที่ ${d} ของทุกเดือน`)
        );
      } else {
        setShowIntakeRounds(false);
        setAvailableRounds([]);
      }
      form.setValue("intakeRound", "");
    } else {
      setShowIntakeRounds(false);
      setAvailableRounds([]);
    }
  }, [watchedIntakeMode, form]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // simulate API call
      await new Promise((r) => setTimeout(r, 2000));

      // NOTE: ตรรกะ mapping ชื่อยังคงอิง mock-data เดิม (คงไว้ตามคำสั่ง)
      const faculty = faculties.find((f) => f.id === values.faculty);
      const department = faculty?.departments.find(
        (d) => d.id === values.department
      );
      const program = department?.programs.find((p) => p.id === values.program);
      const intakeMode = intakeConfig.intakeModes.find(
        (m) => m.id === values.intakeMode
      );

      const formData: FormData = {
        ...values,
        faculty: faculty?.name || values.faculty,
        department: department?.name || values.department,
        program: program?.name || values.program,
        intakeMode: intakeMode?.label || values.intakeMode,
      };

      onSubmit?.(formData);
      toast.success("ส่งข้อมูลสำเร็จ", {
        description: "ข้อมูลแบบสำรวจได้รับการบันทึกเรียบร้อยแล้ว",
      });
      form.reset();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const getStatusColor = () => {
    switch (intakeConfig.status) {
      case "open":
        return "bg-green-50 border-green-200 text-green-800";
      case "closing":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "closed":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Announcement Banner */}
      <Alert className={getStatusColor()}>
        <Calendar className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>
              ประกาศการรับสมัคร ภาคการศึกษาที่ {intakeConfig.term}
            </strong>
            <br />
            {intakeConfig.announcementText}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={intakeConfig.calendarUrl}
              target="_blank"
              rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              ปฏิทิน
            </a>
          </Button>
        </AlertDescription>
      </Alert>

      {/* Window Status Alert */}
      {!isWindowOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            การรับสมัครได้ปิดรับแล้ว หรือยังไม่ถึงเวลาเปิดรับสมัคร
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            แบบสำรวจการคัดเลือกนักศึกษา
          </h2>
          <p className="text-gray-600">กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง</p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6">
            {/* Faculty (เดิม) */}
            <FormField
              control={form.control}
              name="faculty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    คณะ <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger disabled={loading}>
                        <SelectValue
                          placeholder={loading ? "กำลังโหลดคณะ..." : "เลือกคณะ"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContentSimple>
                      {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContentSimple>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department (แก้เฉพาะส่วนนี้: ใช้ availableDepartments ที่มาจาก API) */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    ภาควิชา/สาขาวิชา <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      !watchedFaculty ||
                      deptLoading ||
                      availableDepartments.length === 0
                    }>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !watchedFaculty
                              ? "กรุณาเลือกคณะก่อน"
                              : deptLoading
                              ? "กำลังโหลดภาควิชา..."
                              : "เลือกภาควิชา"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContentSimple>
                      {availableDepartments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                      {!deptLoading &&
                        availableDepartments.length === 0 &&
                        watchedFaculty && (
                          <SelectItem value="__empty__" disabled>
                            ไม่มีข้อมูล
                          </SelectItem>
                        )}
                    </SelectContentSimple>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Program (เดิม – ยังไม่เชื่อม API) */}
            <FormField
              control={form.control}
              name="program"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    สาขาวิชา <span className="text-red-500">*</span>
                  </FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      !watchedDepartment ||
                      progLoading ||
                      availablePrograms.length === 0
                    }>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !watchedDepartment
                              ? "กรุณาเลือกภาควิชาก่อน"
                              : progLoading
                              ? "กำลังโหลดสาขาวิชา..."
                              : "เลือกสาขาวิชา"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {availablePrograms.map((program) => (
                        <SelectItem
                          key={program.id}
                          value={program.id}
                          disabled={!program.open}>
                          {program.name} {!program.open && " (ปิดรับสมัคร)"}
                        </SelectItem>
                      ))}

                      {!progLoading &&
                        watchedDepartment &&
                        availablePrograms.length === 0 && (
                          <SelectItem value="__no_programs__" disabled>
                            ไม่มีข้อมูล
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Intake Mode (เดิม) */}
            <FormField
              control={form.control}
              name="intakeMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium">
                    รูปแบบการรับสมัคร <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2">
                      {intakeConfig.intakeModes.map((mode) => (
                        <div
                          key={mode.id}
                          className="flex items-center space-x-2">
                          <RadioGroupItem value={mode.id} id={mode.id} />
                          <Label htmlFor={mode.id} className="font-normal">
                            {mode.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Intake Rounds (เดิม) */}
            {showIntakeRounds && availableRounds.length > 0 && (
              <FormField
                control={form.control}
                name="intakeRound"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      เลือกรอบ/วันที่ <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรอบ/วันที่" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRounds.map((round, index) => (
                          <SelectItem key={index} value={round}>
                            {round}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            {/* Coordinator (เดิม) */}
            <FormField
              control={form.control}
              name="coordinator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    ผู้ประสานงาน <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="ชื่อผู้ประสานงาน" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone (เดิม) */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="02-470-8000"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email (เดิม) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    อีเมล <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@mail.kmutt.ac.th"
                      type="email"
                      readOnly
                      className="bg-gray-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit (เดิม) */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="w-full sm:w-auto">
                  กลับ
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !isWindowOpen}
                className="w-full sm:flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังส่งข้อมูล...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    ส่งข้อมูล
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
