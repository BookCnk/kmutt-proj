// components/survey/fields/ProgramSelect.tsx
"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
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
import type { ProgramOption } from "../types";
import { toast } from "sonner";

/** โครงสร้างข้อมูลต่อแถว */
export type ProgramRow = {
  program: string; // program id
  masters: number; // จำนวนรับ ป.โท
  doctorals: number; // จำนวนรับ ป.เอก
};

type Props = {
  /** path ของ array ในฟอร์ม เช่น "programs" */
  name: string;
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
  const { control, register, setValue, watch } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name, // e.g. "programs"
  });

  // ✅ กัน crash: ดูค่าในฟอร์ม ถ้าไม่ใช่ array ให้กลายเป็น []
  const raw = watch(name as any);
  const rows: ProgramRow[] = Array.isArray(raw) ? (raw as ProgramRow[]) : [];

  // ✅ สร้างเซ็ตของ program-id ที่ถูกเลือกอยู่ทั้งหมด
  const selectedIdsAll = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r && r.program) set.add(String(r.program));
    }
    return set;
  }, [rows]);

  const addRow = () =>
    append({
      program: "",
      masters: 0,
      doctorals: 0,
    } as ProgramRow);

  return (
    <div className="space-y-4">
      {/* Header */}
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
          const base = `${name}.${idx}`; // e.g. "programs.0"
          const currentSelected = rows?.[idx]?.program ?? "";

          // ชุด id ที่ต้อง disabled ในแถวนี้ (คือ id ที่ถูกใช้ในแถวอื่น)
          const disabledIdsForThisRow = (() => {
            const s = new Set(selectedIdsAll);
            if (currentSelected) s.delete(String(currentSelected));
            return s;
          })();

          const handleSelectChange = (val: string) => {
            if (disabledIdsForThisRow.has(val)) {
              toast.warning("สาขานี้ถูกเลือกในรายการอื่นแล้ว");
              return;
            }
            setValue(`${base}.program`, val, {
              shouldValidate: true,
              shouldDirty: true,
            });
          };

          return (
            <Card
              key={field.id}
              className="rounded-xl border border-blue-200 shadow-sm p-4 sm:p-5 space-y-4">
              {/* Row header */}
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

              {/* Select program */}
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
                      const pickedElsewhere = disabledIdsForThisRow.has(p.id);
                      return (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={!p.open || pickedElsewhere}>
                          {p.name}
                          {!p.open && " (ปิดรับสมัคร)"}
                          {pickedElsewhere && " (ถูกเลือกแล้ว)"}
                        </SelectItem>
                      );
                    })}
                    {!loading && departmentSelected && options.length === 0 && (
                      <SelectItem value="__no_programs__" disabled>
                        ไม่มีข้อมูล
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* ให้ RHF เก็บค่า/validate ตอน submit */}
                <input
                  type="hidden"
                  {...register(`${base}.program` as const, { required: true })}
                />

                <FormMessage />
              </FormItem>

              <div className="border-t border-blue-100" />

              {/* Numbers grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Masters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    จำนวนการรับระดับปริญญาโท *
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      className="h-11 pr-14"
                      {...register(`${base}.masters` as const, {
                        valueAsNumber: true,
                        required: true,
                        min: 0,
                      })}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                      คน
                    </span>
                  </div>
                </div>

                {/* Doctorals */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    จำนวนการรับระดับปริญญาเอก *
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      className="h-11 pr-14"
                      {...register(`${base}.doctorals` as const, {
                        valueAsNumber: true,
                        required: true,
                        min: 0,
                      })}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                      คน
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
