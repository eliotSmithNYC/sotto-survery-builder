"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors",
    secondary:
      "px-4 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors",
    ghost:
      "p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors",
    destructive: "text-sm text-red-600 hover:text-red-700 transition-colors",
  };

  return (
    <button className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </button>
  );
}
