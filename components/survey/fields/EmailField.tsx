// components/survey/fields/EmailField.tsx
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

export default function EmailField({ name }: { name: "email" }) {
  const { control } = useFormContext<FormValues>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            อีเมล <span className="text-red-500">*</span>
          </FormLabel>
          <FormControl>
            <Input
              placeholder="example@mail.kmutt.ac.th"
              type="email"
              readOnly
              className="bg-gray-50"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
