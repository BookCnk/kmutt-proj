// api/departmentService.ts
import api from "@/lib/api";
import {
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentResponse,
} from "@/types/department";

const BASE = "/department";

export const getDepartments = async (): Promise<DepartmentResponse> =>
  api.get<DepartmentResponse, DepartmentResponse>(BASE);

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

// get departments by facultyId
export const getDepartmentsByFaculty = async (
  facultyId: string
): Promise<DepartmentResponse> =>
  api.get<DepartmentResponse, DepartmentResponse>(
    `${BASE}/faculty/${facultyId}`
  );
