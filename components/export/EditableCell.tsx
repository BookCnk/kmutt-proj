"use client";

import React from "react";

interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number" | "select" | "date" | "textarea";
  options?: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export function EditableCell({
  value,
  onChange,
  type = "text",
  options,
  disabled = false,
  className = "",
  placeholder,
  required = false,
  rows = 3,
}: EditableCellProps) {
  const [error, setError] = React.useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let newValue: string | number = e.target.value;

    if (type === "number") {
      const numValue = parseFloat(e.target.value);
      if (isNaN(numValue) && e.target.value !== "") {
        setError("ต้องเป็นตัวเลข");
        return;
      }
      newValue = numValue || 0;
    }

    if (type === "date") {
      // Keep the date value as string in YYYY-MM-DD format
      newValue = e.target.value;
    }

    if (type === "textarea") {
      // Preserve all formatting including spaces and newlines
      newValue = e.target.value;
    }

    // Validate required fields
    if (required && !newValue) {
      setError("ฟิลด์นี้จำเป็นต้องกรอก");
    } else {
      setError("");
    }

    onChange(newValue);
  };

  const baseClassName = `w-full px-2 py-1 bg-transparent border-0 focus:outline-none focus:ring-2 ${
    error ? 'ring-2 ring-red-500' : 'focus:ring-emerald-500'
  } rounded ${className}`;

  if (type === "select" && options) {
    return (
      <div className="relative">
        <select
          value={String(value)}
          onChange={handleChange}
          disabled={disabled}
          className={`${baseClassName} cursor-pointer`}
          required={required}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={`${baseClassName} resize-y ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          style={{ whiteSpace: 'pre-wrap' }}
        />
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className={`${baseClassName} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      />
      {error && <div className="text-xs text-red-600 mt-1 absolute whitespace-nowrap">{error}</div>}
    </div>
  );
}
