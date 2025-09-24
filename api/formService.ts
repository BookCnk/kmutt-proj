// src/api/formService.ts
import api from "@/lib/api";
import { Form, CreateFormDto, UpdateFormDto, FormStatus } from "@/types/form";

export const BASE = "/form";

// ---------- แบบมีพารามิเตอร์ (ค้นหา/เรียง/แบ่งหน้า) ----------

export type FormListResult = {
  items: Form[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

export type FormListParams = {
  limit?: number;
  page?: number;
  search?: string;
  search_option?: string; // e.g. 'faculty' | 'department_name' | 'program'
  status?: string;
  admission_id?: string;
  faculty_id?: string;
  department_id?: string;
  program_id?: string;
  submitter_name?: string;
  submitter_email?: string;
  date_start?: string; // 'YYYY-MM-DD'
  date_end?: string; // 'YYYY-MM-DD'
  sort?: number; // << number only
  sort_option?: "asc" | "desc";
};

function buildQuery(params: FormListParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    // number -> string
    qs.append(k, String(v));
  });
  return qs.toString();
}

// ---------- getForms: รองรับทั้งสองโหมดโดยไม่ทำของเดิมพัง ----------
export async function getForms(): Promise<Form[]>;
export async function getForms(params: FormListParams): Promise<FormListResult>;

export async function getForms(
  params?: FormListParams
): Promise<Form[] | FormListResult> {
  const qs = params ? buildQuery(params) : "";
  const url = qs ? `${BASE}?${qs}` : BASE;

  // หมายเหตุ: api.get คืน body ตรง ๆ (ถูกดักใน interceptor แล้ว)
  const res: any = await api.get(url);

  // รองรับหลายทรง response
  const items: Form[] = Array.isArray(res)
    ? res
    : res?.data ?? res?.items ?? [];

  // โหมดเดิม: ไม่มีพารามิเตอร์ -> คืนเป็น array
  if (!params) return items;

  // โหมดมีพารามิเตอร์ -> คืนเป็นผลลัพธ์แบบมีหน้า
  const total =
    res?.pagination?.total ??
    res?.total ??
    (Array.isArray(res) ? items.length : 0);

  const page = res?.pagination?.page ?? Number(params.page ?? 1);
  const limit = res?.pagination?.limit ?? Number(params.limit ?? 10);
  const pages =
    res?.pagination?.pages ??
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return { items, total, page, pages, limit };
}

// (ทางเลือก) alias ให้ชัดเจน
export const getFormsList = (params: FormListParams = {}) =>
  getForms(params) as Promise<FormListResult>;
export const getFormsRaw = () => getForms() as Promise<Form[]>;

// ---------- CRUD พื้นฐาน ----------
export const getFormById = async (id: string): Promise<Form> =>
  api.get<Form, Form>(`${BASE}/${id}`);

export const createForm = async (payload: CreateFormDto): Promise<Form> =>
  api.post<Form, Form, CreateFormDto>(BASE, payload);

export const updateForm = async (
  id: string,
  payload: UpdateFormDto
): Promise<Form> =>
  api.put<Form, Form, UpdateFormDto>(`${BASE}/${id}`, payload);

export const deleteForm = async (id: string): Promise<void> =>
  api.delete<void, void>(`${BASE}/${id}`);

// ---------- เฉพาะทาง ----------
export const getFormsByAdmission = async (
  admissionId: string
): Promise<Form[]> =>
  api.get<Form[], Form[]>(`${BASE}/admission/${admissionId}`);

export const getFormsByProgram = async (programId: string): Promise<Form[]> =>
  api.get<Form[], Form[]>(`${BASE}/program/${programId}`);

export const getFormsByStatus = async (status: FormStatus): Promise<Form[]> =>
  api.get<Form[], Form[]>(`${BASE}/status/${status}`);

// อัปเดตสถานะอย่างเดียว
export const updateFormStatus = async (
  id: string,
  status: FormStatus
): Promise<Form> =>
  api.put<Form, Form, { status: FormStatus }>(`${BASE}/${id}/status`, {
    status,
  });
