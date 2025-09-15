// components/survey/fields/FacultySelect.tsx
"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { FormValues } from "../schema";
import type { Option } from "../types";

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
  name: "faculty";
  options: Option[];
  loading: boolean;
};

export default function FacultySelect({ name, options, loading }: Props) {
  const { control } = useFormContext<FormValues>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            คณะ <span className="text-red-500">*</span>
          </FormLabel>
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger disabled={loading}>
                <SelectValue
                  placeholder={loading ? "กำลังโหลดคณะ..." : "เลือกคณะ"}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
