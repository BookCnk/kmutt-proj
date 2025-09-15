// components/survey/fields/CoordinatorField.tsx
"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { FormValues } from "../schema";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function CoordinatorField({ name }: { name: "coordinator" }) {
  const { control } = useFormContext<FormValues>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            ผู้ประสานงาน <span className="text-red-500">*</span>
          </FormLabel>
          <FormControl>
            <Input placeholder="ชื่อผู้ประสานงาน" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
