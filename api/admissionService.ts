// api/admissionService.ts
import api from "@/lib/api";
import {
  Admission,
  AdmissionResponse,
  CreateAdmissionDto,
  UpdateAdmissionDto,
} from "@/types/admission";
const BASE = "/admission";

// GET /admission
export const getAdmissions = async (): Promise<AdmissionResponse> =>
  api.get<AdmissionResponse, AdmissionResponse>(`${BASE}/active`);

// GET /admission/{id}
export const getAdmissionById = async (id: string): Promise<Admission> =>
  api.get<Admission, Admission>(`${BASE}/${id}`);

// POST /admission
export const createAdmission = async (
  payload: CreateAdmissionDto
): Promise<Admission> =>
  api.post<Admission, Admission, CreateAdmissionDto>(`admin${BASE}`, payload);

// PUT /admission/{id}
export const updateAdmission = async (
  id: string,
  payload: UpdateAdmissionDto
): Promise<Admission> =>
  api.put<Admission, Admission, UpdateAdmissionDto>(
    `admin${BASE}/${id}`,
    payload
  );

// DELETE /admission/{id}
export const deleteAdmission = async (id: string): Promise<void> =>
  api.delete<void, void>(`admin${BASE}/${id}`);

// PUT /admission/{id}/toggle-active
export const toggleAdmissionActive = async (id: string): Promise<Admission> =>
  api.put<Admission, Admission>(`admin${BASE}/${id}/toggle-active`);
