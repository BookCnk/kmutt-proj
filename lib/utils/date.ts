// src/utils/date.ts
export const parseISODateLocal = (iso: string) => {
  if (!iso) return undefined as unknown as Date;
  if (iso.includes("T")) return new Date(iso);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const toISODateLocal = (d: Date) =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(
    2,
    "0"
  )}-${`${d.getDate()}`.padStart(2, "0")}`;

export const toISOStartOfDayUTC = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  ).toISOString();

export const toISOEndOfDayUTC = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  ).toISOString();

export const toLocalDateOnly = (v?: string) => {
  if (!v) return undefined;
  const d = parseISODateLocal(v);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
