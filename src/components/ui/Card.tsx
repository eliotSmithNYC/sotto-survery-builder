"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "selected" | "hover";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

export default function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  const baseStyles = "border border-zinc-200 rounded-lg bg-white";

  const variantStyles = {
    default: baseStyles,
    selected: cn(baseStyles, "ring-2 ring-zinc-900"),
    hover: cn(baseStyles, "cursor-pointer hover:bg-zinc-50 transition-colors"),
  };

  return (
    <div
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

