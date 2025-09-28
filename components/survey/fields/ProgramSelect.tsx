// src/components/survey/fields/ProgramSelect.tsx
"use client";
import * as React from "react";
import { useMemo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

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

  // master fields
  masters?: number; // amount
  master_bachelor_req?: boolean;

  // doctoral fields
  doctorals?: number; // amount
  doctoral_bachelor_req?: boolean;
  doctoral_master_req?: boolean;
};

type Props = {
  name: string; // e.g. "programs"
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

  const addRow = () =>
    append({
      program: "",
      masters: undefined,
      master_bachelor_req: false,
      doctorals: undefined,
      doctoral_bachelor_req: false,
      doctoral_master_req: false,
    } as Row);

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
              setValue(`${base}.doctorals`, undefined);
              setValue(`${base}.doctoral_bachelor_req`, false);
              setValue(`${base}.doctoral_master_req`, false);
              unregister(`${base}.doctorals`);
              unregister(`${base}.doctoral_bachelor_req`);
              unregister(`${base}.doctoral_master_req`);
            } else if (picked?.degree_level === "doctoral") {
              setValue(`${base}.masters`, undefined);
              setValue(`${base}.master_bachelor_req`, false);
              unregister(`${base}.masters`);
              unregister(`${base}.master_bachelor_req`);
            }
          };

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
                  กรุณาเลือกสาขาก่อน จึงจะระบุจำนวนรับ/เงื่อนไขได้
                </div>
              )}

              {hasPickedProgram && (
                <>
                  {/* master-only */}
                  {level === "master" && (
                    <div className="space-y-3">
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
                            setValueAs: (v) =>
                              v === "" || v == null ? undefined : Number(v),
                          })}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                          คน
                        </span>
                      </div>

                      {/* ✔ ใช้ Controller เพื่อได้ boolean จริง */}
                      <label className="flex items-center gap-2 text-sm">
                        <Controller
                          name={`${base}.master_bachelor_req` as const}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          )}
                        />
                        ต้องสำเร็จปริญญาตรี (bachelor_req)
                      </label>
                    </div>
                  )}

                  {/* doctoral-only */}
                  {level === "doctoral" && (
                    <div className="space-y-3">
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
                            setValueAs: (v) =>
                              v === "" || v == null ? undefined : Number(v),
                          })}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                          คน
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <label className="flex items-center gap-2">
                          <Controller
                            name={`${base}.doctoral_bachelor_req` as const}
                            control={control}
                            render={({ field }) => (
                              <input
                                type="checkbox"
                                checked={!!field.value}
                                onChange={(e) =>
                                  field.onChange(e.target.checked)
                                }
                              />
                            )}
                          />
                          ต้องสำเร็จปริญญาตรี (bachelor_req)
                        </label>
                        <label className="flex items-center gap-2">
                          <Controller
                            name={`${base}.doctoral_master_req` as const}
                            control={control}
                            render={({ field }) => (
                              <input
                                type="checkbox"
                                checked={!!field.value}
                                onChange={(e) =>
                                  field.onChange(e.target.checked)
                                }
                              />
                            )}
                          />
                          ต้องสำเร็จปริญญาโท (master_req)
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ไม่ระบุ degree_level => ให้กรอกได้ทั้งสองฝั่ง */}
                  {!level && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <label className="text-sm font-medium">
                          โท: จำนวนรับ
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          {...register(`${base}.masters` as const, {
                            valueAsNumber: true,
                            min: 0,
                            setValueAs: (v) =>
                              v === "" || v == null ? undefined : Number(v),
                          })}
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <Controller
                            name={`${base}.master_bachelor_req` as const}
                            control={control}
                            render={({ field }) => (
                              <input
                                type="checkbox"
                                checked={!!field.value}
                                onChange={(e) =>
                                  field.onChange(e.target.checked)
                                }
                              />
                            )}
                          />
                          ต้องจบตรี
                        </label>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium">
                          เอก: จำนวนรับ
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          {...register(`${base}.doctorals` as const, {
                            valueAsNumber: true,
                            min: 0,
                            setValueAs: (v) =>
                              v === "" || v == null ? undefined : Number(v),
                          })}
                        />
                        <div className="space-y-2 text-sm">
                          <label className="flex items-center gap-2">
                            <Controller
                              name={`${base}.doctoral_bachelor_req` as const}
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  checked={!!field.value}
                                  onChange={(e) =>
                                    field.onChange(e.target.checked)
                                  }
                                />
                              )}
                            />
                            ต้องจบตรี
                          </label>
                          <label className="flex items-center gap-2">
                            <Controller
                              name={`${base}.doctoral_master_req` as const}
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  checked={!!field.value}
                                  onChange={(e) =>
                                    field.onChange(e.target.checked)
                                  }
                                />
                              )}
                            />
                            ต้องจบโท
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
