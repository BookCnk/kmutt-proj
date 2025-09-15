// components/survey/fields/PhoneField.tsx
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

function formatPhone(v: string) {
  // ฟอร์แมตรวดเร็ว (ปรับได้ตามต้องการ)
  return v.replace(/[^\d+()-\s]/g, "");
}

export default function PhoneField({ name }: { name: "phone" }) {
  const { control } = useFormContext<FormValues>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
          </FormLabel>
          <FormControl>
            <Input
              placeholder="02-470-8000"
              {...field}
              onChange={(e) => field.onChange(formatPhone(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
