export type Program = {
  _id: string;
  faculty_id: {
    _id: string;
    title: string;
  };
  department_id: {
    _id: string;
    title: string;
  };
  title: string;
  degree_level: string;
  degree_abbr: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  __v?: number;
};

export type CreateProgramDto = {
  faculty_id: string;
  department_id: string;
  title: string;
  degree_level: string;
  degree_abbr: string;
  active?: boolean;
};

export type UpdateProgramDto = Partial<CreateProgramDto>;

export type ProgramResponse = {
  status: boolean;
  info: {
    pages: number;
    limit: number;
    currentCount: number;
    totalCount: number;
  };
  data: Program[];
};
