// types
export type Faculty = {
  _id: string;
  id?: string;
  title: string;
  order?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateFacultyDto = { title: string; order?: number; active?: boolean };
export type UpdateFacultyDto = Partial<CreateFacultyDto>;

export type FacultyResponse = {
  status: boolean;
  info?: {
    count?: number;
    pages?: number;
    next?: number | null;
    prev?: number | null;
    limit?: number;
    currentCount?: number;
    totalCount?: number;
  };
  data: Faculty[];
};
