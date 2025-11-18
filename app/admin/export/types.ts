export type DataRow = {
  id: string;
  data: (string | number)[];
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
