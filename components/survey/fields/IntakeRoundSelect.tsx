// components/survey/fields/IntakeRoundSelect.tsx
"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { FormValues } from "../schema";
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
  name: "intakeRound";
  rounds: string[];
  visible: boolean;
};

export default function IntakeRoundSelect({ name, rounds, visible }: Props) {
  const { control } = useFormContext<FormValues>();
  if (!visible || rounds.length === 0) return null;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            เลือกรอบ/วันที่ <span className="text-red-500">*</span>
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="เลือกรอบ/วันที่" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {rounds.map((round, index) => (
                <SelectItem key={index} value={round}>
                  {round}
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
