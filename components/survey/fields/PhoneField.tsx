// components/survey/fields/PhonesField.tsx
"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import type { FormValues } from "../schema";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

function formatPhone(v: string) {
  // อนุญาตเฉพาะอักขระที่ใช้บ่อยในเบอร์โทร
  return (v || "").replace(/[^\d+()\-\s.]/g, "");
}

export default function PhonesField({ name }: { name: "phone" }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();

  const phones = watch(name) ?? [];

  // ให้มีอย่างน้อย 1 ช่องเสมอ
  React.useEffect(() => {
    if (!Array.isArray(phones) || phones.length === 0) {
      setValue(name, [""], { shouldDirty: false, shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addOne = () =>
    setValue(name, [...(phones || []), ""], {
      shouldDirty: true,
      shouldValidate: true,
    });

  const removeAt = (idx: number) => {
    const next = [...phones];
    next.splice(idx, 1);
    // ถ้าลบจนหมด เติมช่องว่างกลับมา 1 ช่อง
    setValue(name, next.length ? next : [""], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const updateAt = (idx: number, v: string) => {
    const next = [...phones];
    next[idx] = formatPhone(v);
    setValue(name, next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <FormItem>
      <div className="flex items-center justify-between">
        <FormLabel className="text-base font-medium">
          หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
        </FormLabel>
        <Button type="button" variant="outline" size="sm" onClick={addOne}>
          <Plus className="h-4 w-4 mr-1" />
          เพิ่มเบอร์
        </Button>
      </div>

      <div className="space-y-2 mt-2">
        {phones.map((val, idx) => {
          const errAt =
            (errors as any)?.phone?.[idx]?.message ||
            (errors as any)?.phone?.message;

          return (
            <div key={idx} className="flex items-start gap-2">
              <FormControl className="flex-1">
                <Input
                  placeholder="02-470-8000"
                  value={val ?? ""}
                  onChange={(e) => updateAt(idx, e.target.value)}
                  aria-invalid={!!errAt}
                />
              </FormControl>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeAt(idx)}
                aria-label={`ลบเบอร์ที่ ${idx + 1}`}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* error ของทั้ง array (เช่น ต้องมีอย่างน้อย 1 เบอร์) */}
      <FormMessage />
    </FormItem>
  );
}
