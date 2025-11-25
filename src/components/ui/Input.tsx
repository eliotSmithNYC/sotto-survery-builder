"use client";

import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type InputType = "text" | "textarea" | "select";

interface BaseInputProps {
  type: InputType;
  className?: string;
}

type InputProps = BaseInputProps &
  (
    | (InputHTMLAttributes<HTMLInputElement> & { type: "text" })
    | (TextareaHTMLAttributes<HTMLTextAreaElement> & { type: "textarea" })
    | (SelectHTMLAttributes<HTMLSelectElement> & { type: "select"; children: React.ReactNode })
  );

const baseStyles =
  "w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent";

export default function Input({ type, className, ...props }: InputProps) {
  if (type === "textarea") {
    const { type: _, ...textareaProps } = props as TextareaHTMLAttributes<HTMLTextAreaElement>;
    return (
      <textarea
        className={cn(baseStyles, "resize-y", className)}
        {...textareaProps}
      />
    );
  }

  if (type === "select") {
    const { type: _, children, ...selectProps } = props as SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode };
    return (
      <select
        className={cn(baseStyles, className)}
        {...selectProps}
      >
        {children}
      </select>
    );
  }

  const { type: _, ...inputProps } = props as InputHTMLAttributes<HTMLInputElement>;
  return (
    <input
      type="text"
      className={cn(baseStyles, className)}
      {...inputProps}
    />
  );
}

