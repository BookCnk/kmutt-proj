// types
export type Faculty = {
  id: string;
  title: string;
  order?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateFacultyDto = { title: string; order?: number; active?: boolean };
export type UpdateFacultyDto = Partial<CreateFacultyDto>;
