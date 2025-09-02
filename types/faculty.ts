// types
export type Faculty = {
  id: string;
  title: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateFacultyDto = { title: string; active: boolean };
export type UpdateFacultyDto = Partial<CreateFacultyDto>;
