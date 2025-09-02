export type Department = {
  _id: string;
  faculty_id: {
    _id: string;
    title: string;
  };
  title: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  __v?: number;
};

export type CreateDepartmentDto = {
  faculty_id: string;
  title: string;
  active?: boolean;
};

export type UpdateDepartmentDto = {
  faculty_id?: string;
  title?: string;
  active?: boolean;
};

export type DepartmentResponse = {
  status: boolean;
  info: {
    pages: number;
    limit: number;
    currentCount: number;
    totalCount: number;
  };
  data: Department[];
};
