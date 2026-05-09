export type Department = {
  _id: string;
  id?: string;
  faculty_id:
    | string
    | {
        _id: string;
        title: string;
        order?: number;
        active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
  title: string;
  order?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  __v?: number;
};

export type CreateDepartmentDto = {
  faculty_id: string;
  title: string;
  order?: number;
  active?: boolean;
};

export type UpdateDepartmentDto = {
  faculty_id?: string;
  title?: string;
  order?: number;
  active?: boolean;
};

export type DepartmentResponse = {
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
  data: Department[];
};
