// api/templateService.ts
import api from "@/lib/api";
import { CreateTemplateDto } from "@/types/template";

const BASE = "/template";

/** POST /api/admin/template — Create/Save template */
export const saveTemplate = async (payload: CreateTemplateDto): Promise<any> =>
  api.post<any, CreateTemplateDto>(`/admin${BASE}`, payload);

/** GET /api/template — Get all templates */
export const getTemplates = async (): Promise<any> => api.get<any, any>(BASE);

/** GET /api/template/:id — Get template by id */
export const getTemplateById = async (id: string): Promise<any> =>
  api.get<any, any>(`${BASE}/${id}`);

/** PUT /api/admin/template/:id — Update template */
export const updateTemplate = async (
  id: string,
  payload: CreateTemplateDto
): Promise<any> =>
  api.put<any, any, CreateTemplateDto>(`/admin${BASE}/${id}`, payload);

/** DELETE /api/admin/template/:id — Delete template */
export const deleteTemplate = async (id: string): Promise<void> =>
  api.delete<void, void>(`/admin${BASE}/${id}`);

export const duplicateTemplate = async (id: string): Promise<any> =>
  api.post<any, void>(`/admin${BASE}/${id}/dup`); 
