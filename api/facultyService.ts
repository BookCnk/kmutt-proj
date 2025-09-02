// api/facultyService.ts
import api from "@/lib/api";
import { Faculty, CreateFacultyDto, UpdateFacultyDto } from "@/types/faculty";

const BASE = "/faculty";

export const getFaculties = async (): Promise<Faculty[]> =>
  api.get<Faculty[], Faculty[]>(BASE);

export const getFacultyById = async (id: string): Promise<Faculty> =>
  api.get<Faculty, Faculty>(`${BASE}/${id}`);

export const createFaculty = async (
  payload: CreateFacultyDto
): Promise<Faculty> =>
  api.post<Faculty, Faculty, CreateFacultyDto>(BASE, payload);

export const updateFaculty = async (
  id: string,
  payload: UpdateFacultyDto
): Promise<Faculty> =>
  api.put<Faculty, Faculty, UpdateFacultyDto>(`${BASE}/${id}`, payload);

export const deleteFaculty = async (id: string): Promise<void> => {
  await api.delete<void, void>(`${BASE}/${id}`);
};
