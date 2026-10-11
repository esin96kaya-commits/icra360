import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-[#8A5A12]",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-canvas text-navy/70",
} as const;

export function StatusPill({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
