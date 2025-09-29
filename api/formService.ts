// src/api/formService.ts
import api from "@/lib/api";
import { Form, CreateFormPayloadV2, UpdateFormDto } from "@/types/form";

/* ------------------------ User endpoints ------------------------ */
export const BASE = "/form";

/** GET /form – ดึงฟอร์มทั้งหมดของผู้ใช้ (array ตรง ๆ) */
export const getForms = async (): Promise<Form[]> =>
  api.get<Form[], Form[]>(BASE);

/** GET /form/:id – ดึงฟอร์มตามไอดี */
export const getFormById = async (id: string): Promise<Form> =>
  api.get<Form, Form>(`${BASE}/${id}`);

/** POST /form – สร้างฟอร์มใหม่ (ปล่อยเป็น any ให้ยืดหยุ่นทรง response) */
export const createForm = async (payload: CreateFormPayloadV2): Promise<any> =>
  api.post<any, CreateFormPayloadV2>(BASE, payload);

/** PUT /form/:id – แก้ไขฟอร์ม */
export const updateForm = async (
  id: string,
  payload: UpdateFormDto
): Promise<Form> =>
  api.put<Form, Form, UpdateFormDto>(`${BASE}/${id}`, payload);

/** DELETE /form/:id – ลบฟอร์ม */
export const deleteForm = async (id: string): Promise<void> =>
  api.delete<void, void>(`${BASE}/${id}`);

/* ------------------------ Admin endpoints ----------------------- */
export const ADMIN_BASE = "/admin/form";

/** พารามิเตอร์ที่ Swagger โชว์ไว้สำหรับ GET /api/admin/form */
export type FormListParams = {
  limit?: number;
  page?: number;
  search?: string;
  search_option?: string; // 'faculty' | 'department_name' | 'program' ...
  status?: string;
  admission_id?: string;
  faculty_id?: string;
  department_id?: string;
  program_id?: string;
  submitter_name?: string;
  submitter_email?: string;
  date_start?: string; // 'YYYY-MM-DD'
  date_end?: string; // 'YYYY-MM-DD'
  sort?: number; // 1=faculty,2=department,3=program,4=submitter_name,5=submitter_email,6=created_at
  sort_option?: "asc" | "desc";
};

export type FormListResult = {
  items: Form[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

function buildQuery(params: FormListParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.append(k, String(v));
  });
  return qs.toString();
}

function normalizeListResponse(
  res: any,
  fallbackPage = 1,
  fallbackLimit = 10
): FormListResult {
  const items: Form[] = Array.isArray(res)
    ? res
    : res?.items ?? res?.data ?? [];
  const total =
    res?.pagination?.total ??
    res?.total ??
    (Array.isArray(res) ? items.length : 0);
  const page = Number(res?.pagination?.page ?? fallbackPage);
  const limit = Number(
    res?.pagination?.limit ??
      (Array.isArray(res) ? items.length || fallbackLimit : fallbackLimit)
  );
  const pages =
    res?.pagination?.pages ??
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return { items, total, page, pages, limit };
}

/* ------------------------ Admin List (server-side) --------------- */
/** GET /api/admin/form – รองรับ query params ทั้งหมด */
export const adminListForms = async (
  params: FormListParams = {}
): Promise<FormListResult> => {
  const qs = buildQuery(params);
  const url = qs ? `${ADMIN_BASE}?${qs}` : ADMIN_BASE;
  const res: any = await api.get(url);
  return normalizeListResponse(
    res,
    Number(params.page ?? 1),
    Number(params.limit ?? 10)
  );
};

/** ดึงเฉพาะรายการ (array) */
export const adminGetFormsRaw = async (params: FormListParams = {}) =>
  (await adminListForms(params)).items;

/** GET /api/admin/form/:id */
export const adminGetFormById = async (id: string): Promise<Form> =>
  api.get<Form, Form>(`${ADMIN_BASE}/${id}`);

/** POST /api/admin/form */
export const adminCreateForm = async (
  payload: CreateFormPayloadV2
): Promise<any> => api.post<any, CreateFormPayloadV2>(ADMIN_BASE, payload);

/** PUT /api/admin/form/:id */
export const adminUpdateForm = async (
  id: string,
  payload: UpdateFormDto
): Promise<Form> =>
  api.put<Form, Form, UpdateFormDto>(`${ADMIN_BASE}/${id}`, payload);

/** DELETE /api/admin/form/:id */
export const adminDeleteForm = async (id: string): Promise<void> =>
  api.delete<void, void>(`${ADMIN_BASE}/${id}`);

/* ------------------------ User List (client-side emulate) -------- */
/**
 * listForms (user): ทำให้ได้โครงสร้างเดียวกับของ admin
 * โดยจะดึงทั้งหมดก่อน แล้วค่อย filter/sort/page ในฝั่ง client
 * เพื่อให้คอมโพเนนต์เดียวกันใช้งานได้กับทั้ง user/admin
 */
export const listForms = async (
  params: FormListParams = {}
): Promise<FormListResult> => {
  const all = await getForms();

  const toText = (v: any): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return (
      v.title ||
      v.name ||
      v.label ||
      v.text ||
      v.value ||
      v.code ||
      v._id ||
      v.id ||
      ""
    );
  };

  // ---- filter ----
  let items = all.filter((f) => {
    const search = (params.search || "").toString().trim().toLowerCase();

    const getFieldByOption = (opt?: string): string => {
      switch ((opt || "").toLowerCase()) {
        case "faculty":
          return toText((f as any).faculty_id).toLowerCase();
        case "department":
        case "department_name":
          return toText((f as any).department_id).toLowerCase();
        case "program":
          return toText((f as any).program_id).toLowerCase();
        default:
          return "";
      }
    };

    if (search) {
      const hay = getFieldByOption(params.search_option);
      if (!hay.includes(search)) return false;
    }

    if (params.submitter_name) {
      const n = (f as any)?.submitter?.name || "";
      if (
        !String(n)
          .toLowerCase()
          .includes(String(params.submitter_name).toLowerCase())
      )
        return false;
    }
    if (params.submitter_email) {
      const e = (f as any)?.submitter?.email || "";
      if (
        !String(e)
          .toLowerCase()
          .includes(String(params.submitter_email).toLowerCase())
      )
        return false;
    }

    if (
      params.status &&
      String((f as any)?.status || "") !== String(params.status)
    )
      return false;

    if (params.admission_id) {
      const id = String(
        (f as any)?.admission_id?._id || (f as any)?.admission_id || ""
      );
      if (id !== String(params.admission_id)) return false;
    }
    if (params.faculty_id) {
      const id = String(
        (f as any)?.faculty_id?._id || (f as any)?.faculty_id || ""
      );
      if (id !== String(params.faculty_id)) return false;
    }
    if (params.department_id) {
      const id = String(
        (f as any)?.department_id?._id || (f as any)?.department_id || ""
      );
      if (id !== String(params.department_id)) return false;
    }
    if (params.program_id) {
      const id = String(
        (f as any)?.program_id?._id || (f as any)?.program_id || ""
      );
      if (id !== String(params.program_id)) return false;
    }

    // date range on created_at
    const createdAt = new Date(
      (f as any)?.created_at || (f as any)?.updated_at || 0
    ).getTime();
    if (params.date_start) {
      const start = new Date(params.date_start + "T00:00:00").getTime();
      if (createdAt < start) return false;
    }
    if (params.date_end) {
      const end = new Date(params.date_end + "T23:59:59").getTime();
      if (createdAt > end) return false;
    }

    return true;
  });

  // ---- sort ----
  const sortKey = Number(params.sort || 0);
  const dir = (params.sort_option || "asc") === "asc" ? 1 : -1;
  const getSortVal = (f: any) => {
    switch (sortKey) {
      case 1:
        return toText(f.faculty_id);
      case 2:
        return toText(f.department_id);
      case 3:
        return toText(f.program_id);
      case 4:
        return (f.submitter?.name || "").toString();
      case 5:
        return (f.submitter?.email || "").toString();
      case 6:
        return f.created_at || f.updated_at || "";
      default:
        return f.created_at || f.updated_at || "";
    }
  };
  if (sortKey) {
    items = [...items].sort((a, b) => {
      const av = String(getSortVal(a)).toLowerCase();
      const bv = String(getSortVal(b)).toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  const page = Math.max(1, Number(params.page || 1));
  const limit = Math.max(1, Number(params.limit || 10));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return { items: paged, total, page, pages, limit };
};
