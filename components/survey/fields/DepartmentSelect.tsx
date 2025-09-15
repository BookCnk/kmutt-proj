// components/survey/fields/DepartmentSelect.tsx
"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { FormValues } from "../schema";
import type { DepartmentOption } from "../types";

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

type Props = {
  name: "department";
  facultySelected: boolean;
  options: DepartmentOption[];
  loading: boolean;
};

export default function DepartmentSelect({
  name,
  facultySelected,
  options,
  loading,
}: Props) {
  const { control } = useFormContext<FormValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            ภาควิชา/สาขาวิชา <span className="text-red-500">*</span>
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={!facultySelected || loading || options.length === 0}>
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !facultySelected
                      ? "กรุณาเลือกคณะก่อน"
                      : loading
                      ? "กำลังโหลดภาควิชา..."
                      : "เลือกภาควิชา"
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
              {!loading && options.length === 0 && facultySelected && (
                <SelectItem value="__empty__" disabled>
                  ไม่มีข้อมูล
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
