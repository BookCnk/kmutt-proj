"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export type ProgramOption = {
  id: string;
  name: string;
  open: boolean;
  degree_level?: "master" | "doctoral";
};

type Row = {
  program: string;
  masters?: number;
  doctorals?: number;
};

type Props = {
  name: string; // เช่น "programs"
  departmentSelected: boolean;
  options: ProgramOption[];
  loading: boolean;
};

export default function ProgramSelect({
  name,
  departmentSelected,
  options,
  loading,
}: Props) {
  const { control, register, setValue, watch, unregister } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  const rows = (Array.isArray(watch(name)) ? (watch(name) as Row[]) : []) ?? [];

  // กันเลือกสาขาซ้ำข้ามแถว
  const selectedIdsAll = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r?.program && s.add(String(r.program)));
    return s;
  }, [rows]);

  const addRow = () => append({ program: "", masters: 0, doctorals: 0 } as Row);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel className="text-lg font-semibold">
          สาขาวิชา <span className="text-red-500">*</span>
        </FormLabel>
        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          disabled={!departmentSelected}>
          + เพิ่มสาขา
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="text-sm text-muted-foreground">
          ยังไม่มีสาขา — กด “เพิ่มสาขา”
        </div>
      )}

      <div className="space-y-6">
        {fields.map((field, idx) => {
          const base = `${name}.${idx}`;
          const currentSelected = rows?.[idx]?.program ?? "";

          // กันเลือกซ้ำในแถวอื่น ๆ
          const disabledIdsForThisRow = (() => {
            const s = new Set(selectedIdsAll);
            if (currentSelected) s.delete(String(currentSelected));
            return s;
          })();

          const selectedProgram = options.find(
            (p) => String(p.id) === String(currentSelected)
          );
          const level = selectedProgram?.degree_level;
          const hasPickedProgram = !!currentSelected;

          const handleSelectChange = (val: string) => {
            if (disabledIdsForThisRow.has(val)) {
              toast.warning("สาขานี้ถูกเลือกแล้ว");
              return;
            }
            setValue(`${base}.program`, val, {
              shouldValidate: true,
              shouldDirty: true,
            });

            // รีเซ็ต/ยกเลิกฟิลด์ตามระดับปริญญาที่เลือก
            const picked = options.find((p) => String(p.id) === String(val));
            if (picked?.degree_level === "master") {
              setValue(`${base}.doctorals`, 0);
              unregister(`${base}.doctorals`);
            } else if (picked?.degree_level === "doctoral") {
              setValue(`${base}.masters`, 0);
              unregister(`${base}.masters`);
            }
          };

          // label และชื่อฟิลด์สำหรับ input จำนวนรับ
          const inputLabel =
            level === "master"
              ? "จำนวนการรับระดับปริญญาโท *"
              : level === "doctoral"
              ? "จำนวนการรับระดับปริญญาเอก *"
              : "จำนวนการรับ *";

          const fieldName: "masters" | "doctorals" =
            level === "doctoral" ? "doctorals" : "masters";

          return (
            <Card
              key={field.id}
              className="rounded-xl border border-blue-200 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-blue-600">
                  รายการที่ {idx + 1}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(idx)}>
                  ลบ
                </Button>
              </div>

              {/* เลือกสาขา */}
              <FormItem>
                <FormLabel className="text-base font-medium">
                  เลือกสาขาวิชา
                </FormLabel>
                <Select
                  disabled={
                    !departmentSelected || loading || options.length === 0
                  }
                  value={currentSelected || undefined}
                  onValueChange={handleSelectChange}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue
                        placeholder={
                          !departmentSelected
                            ? "กรุณาเลือกภาควิชาก่อน"
                            : loading
                            ? "กำลังโหลดสาขาวิชา..."
                            : "เลือกสาขาวิชา"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((p) => {
                      const pickedElsewhere = disabledIdsForThisRow.has(
                        String(p.id)
                      );
                      return (
                        <SelectItem
                          key={p.id}
                          value={String(p.id)}
                          disabled={!p.open || pickedElsewhere}>
                          {p.name}
                          {!p.open && " (ปิดรับสมัคร)"}
                          {pickedElsewhere && " (ถูกเลือกแล้ว)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* เก็บค่า program ใน RHF */}
                <input
                  type="hidden"
                  {...register(`${base}.program` as const, { required: true })}
                />
                <FormMessage />
              </FormItem>

              {!hasPickedProgram && (
                <div className="rounded-md bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 text-sm">
                  กรุณาเลือกสาขาก่อน จึงจะระบุจำนวนรับได้
                </div>
              )}

              {hasPickedProgram && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{inputLabel}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      className="h-11 pr-14"
                      {...register(`${base}.${fieldName}` as const, {
                        valueAsNumber: true,
                        required: true,
                        min: 0,
                        // กัน NaN เงียบ ๆ หากช่องถูกล้างจนว่าง
                        setValueAs: (v) =>
                          v === "" || v === null ? undefined : Number(v),
                      })}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                      คน
                    </span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
