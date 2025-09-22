// api/formService.ts
import api from "@/lib/api";
import { Form, CreateFormDto, UpdateFormDto, FormStatus } from "@/types/form";

const BASE = "/form";

// CRUD พื้นฐาน
export const getForms = async (): Promise<Form[]> =>
  api.get<Form[], Form[]>(BASE);

export const getFormById = async (id: string): Promise<Form> =>
  api.get<Form, Form>(`${BASE}/${id}`);

export const createForm = async (payload: CreateFormDto): Promise<Form> =>
  api.post<Form, Form, CreateFormDto>(BASE, payload);

export const updateForm = async (
  id: string,
  payload: UpdateFormDto
): Promise<Form> =>
  api.put<Form, Form, UpdateFormDto>(`${BASE}/${id}`, payload);

export const deleteForm = async (id: string): Promise<void> => {
  await api.delete<void, void>(`${BASE}/${id}`);
};

// เฉพาะทางตามเอกสาร
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
