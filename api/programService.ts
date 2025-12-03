// api/programService.ts
import api from "@/lib/api";
import {
  Program,
  CreateProgramDto,
  UpdateProgramDto,
  ProgramResponse,
} from "@/types/program";

const BASE = "/program";

export const getPrograms = async (): Promise<ProgramResponse> =>
  api.get<ProgramResponse, ProgramResponse>(BASE);

export const getProgramById = async (id: string): Promise<Program> =>
  api.get<Program, Program>(`${BASE}/${id}`);

export const createProgram = async (
  payload: CreateProgramDto
): Promise<Program> =>
  api.post<Program, Program, CreateProgramDto>(`/admin${BASE}`, payload);

export const updateProgram = async (
  id: string,
  payload: UpdateProgramDto
): Promise<Program> =>
  api.put<Program, Program, UpdateProgramDto>(`/admin${BASE}/${id}`, payload);

export const deleteProgram = async (id: string): Promise<void> => {
  await api.delete<void, void>(`/admin${BASE}/${id}`);
};

export const toggleProgramActive = async (id: string): Promise<Program> => {
  return api.put<Program, Program>(`/admin${BASE}/${id}/toggle-active`);
};

// --- Filters ---
export const getProgramsByFaculty = async (
  facultyId: string
): Promise<ProgramResponse> =>
  api.get<ProgramResponse, ProgramResponse>(`${BASE}/faculty/${facultyId}`);

export const getProgramsByDepartment = async (
  departmentId: string
): Promise<ProgramResponse> =>
  api.get<ProgramResponse, ProgramResponse>(
    `/admin${BASE}/department/${departmentId}`
  );

export const getProgramsByDegree = async (
  degreeLevel: string
): Promise<ProgramResponse> =>
  api.get<ProgramResponse, ProgramResponse>(`${BASE}/degree/${degreeLevel}`);
