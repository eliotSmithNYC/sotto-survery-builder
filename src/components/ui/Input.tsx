"use client";

import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type InputProps =
  | (InputHTMLAttributes<HTMLInputElement> & { type: "text" })
  | (TextareaHTMLAttributes<HTMLTextAreaElement> & { type: "textarea" })
  | (SelectHTMLAttributes<HTMLSelectElement> & {
      type: "select";
      children: React.ReactNode;
    });

const baseStyles =
  "w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent";

export default function Input(props: InputProps) {
  const { type, className, ...restProps } = props;

  if (type === "textarea") {
    const textareaProps = restProps as Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      "type"
    >;
    return (
      <textarea
        className={cn(baseStyles, "resize-y", className)}
        {...textareaProps}
      />
    );
  }

  if (type === "select") {
    const { children, ...selectProps } = restProps as Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      "type"
    > & { children: React.ReactNode };
    return (
      <select className={cn(baseStyles, className)} {...selectProps}>
        {children}
      </select>
    );
  }

  const inputProps = restProps as Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  >;
  return (
    <input type="text" className={cn(baseStyles, className)} {...inputProps} />
  );
}
