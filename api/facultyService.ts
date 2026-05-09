// api/facultyService.ts
import api from "@/lib/api";
import {
  Faculty,
  FacultyResponse,
  CreateFacultyDto,
  UpdateFacultyDto,
} from "@/types/faculty";

const BASE = "/faculty";

type FacultyQuery = {
  limit?: number;
  page?: number;
};

type ToggleFacultyResponse = {
  status: boolean;
  message: string;
  data: Faculty;
};

const unwrapFaculty = <T extends Faculty | FacultyResponse | ToggleFacultyResponse>(
  payload: T
): any => ("data" in payload && !Array.isArray(payload.data) ? payload.data : payload);

export const getFaculties = async (
  params?: FacultyQuery
): Promise<FacultyResponse> =>
  api.get<FacultyResponse, FacultyResponse>(BASE, { params });

export const getAdminFaculties = async (
  params?: FacultyQuery
): Promise<FacultyResponse> =>
  api.get<FacultyResponse, FacultyResponse>(`/admin${BASE}`, { params });

export const getFacultyById = async (id: string): Promise<Faculty> =>
  api.get<Faculty, Faculty>(`${BASE}/${id}`);

export const createFaculty = async (
  payload: CreateFacultyDto
): Promise<Faculty> =>
  api.post<Faculty, Faculty, CreateFacultyDto>(`/admin${BASE}`, payload);

export const updateFaculty = async (
  id: string,
  payload: UpdateFacultyDto
): Promise<Faculty> =>
  api.put<Faculty, Faculty, UpdateFacultyDto>(`/admin${BASE}/${id}`, payload);

export const toggleFacultyActive = async (id: string): Promise<Faculty> => {
  const res = await api.put<ToggleFacultyResponse, ToggleFacultyResponse>(
    `/admin${BASE}/${id}/toggle-active`
  );
  return unwrapFaculty(res);
};

export const deleteFaculty = async (id: string): Promise<void> => {
  await api.delete<void, void>(`/admin${BASE}/${id}`);
};
