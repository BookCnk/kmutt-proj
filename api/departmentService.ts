// api/departmentService.ts
import api from "@/lib/api";
import {
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentResponse,
} from "@/types/department";

const BASE = "/department";

type ToggleDepartmentResponse = {
  status: boolean;
  message: string;
  data: Department;
};

export const getDepartments = async (): Promise<DepartmentResponse> =>
  api.get<DepartmentResponse, DepartmentResponse>(BASE);

export const getAdminDepartments = async (): Promise<DepartmentResponse> =>
  api.get<DepartmentResponse, DepartmentResponse>(`/admin${BASE}`);

export const getDepartmentById = async (id: string): Promise<Department> =>
  api.get<Department, Department>(`${BASE}/${id}`);

export const createDepartment = async (
  payload: CreateDepartmentDto
): Promise<Department> =>
  api.post<Department, Department, CreateDepartmentDto>(
    `/admin${BASE}`,
    payload
  );

export const updateDepartment = async (
  id: string,
  payload: UpdateDepartmentDto
): Promise<Department> =>
  api.put<Department, Department, UpdateDepartmentDto>(
    `/admin${BASE}/${id}`,
    payload
  );

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete<void, void>(`/admin${BASE}/${id}`);
};

export const getDepartmentsByFaculty = async (
  facultyId: string
): Promise<DepartmentResponse> =>
  api.get<DepartmentResponse, DepartmentResponse>(
    `${BASE}/faculty/${facultyId}`
  );

export const getAdminDepartmentsByFaculty = async (
  facultyId: string
): Promise<DepartmentResponse> =>
  api.get<DepartmentResponse, DepartmentResponse>(
    `/admin${BASE}/faculty/${facultyId}`
  );

export const toggleDepartmentActive = async (
  id: string
): Promise<Department> => {
  const res = await api.put<ToggleDepartmentResponse, ToggleDepartmentResponse>(
    `/admin${BASE}/${id}/toggle-active`
  );
  return res.data;
};
