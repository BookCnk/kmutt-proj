export type DataRow = {
  id: string;
  no: number;
  sequence: number;
  label_on_web_th: string;
  label_on_web_th_description?: string;
  label_on_web_en: string;
  application_form_status: string;
  start_date: string;
  end_date: string;
  date_description?: string;
  current_stage: "Yes" | "No";
  selected: boolean;
};

export type SheetMatrix = {
  name: string;
  headers: string[];
  rows: DataRow[];
};

export type Step = "idle" | "loaded";

export type ExportConfig = {
  roundNumber: string;
  sheetTitle: string;
  roundTitle: string;
};
