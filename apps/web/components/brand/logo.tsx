import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "horizontal" | "icon";
  tone?: "light" | "dark";
};

export function Icra360Mark({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const navy = tone === "dark" ? "#F4F7F9" : "#142B4A";
  const teal = "#16A6A1";
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill={tone === "dark" ? "#142B4A" : "#F4F7F9"} />
      <path
        d="M14 12.5h14.5a3 3 0 0 1 3 3V33a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V15.5a3 3 0 0 1 3-3Z"
        fill="none"
        stroke={navy}
        strokeWidth="2.2"
      />
      <path d="M18 12.5v-1.2a2.2 2.2 0 0 1 2.2-2.2h7.6A2.2 2.2 0 0 1 30 11.3v1.2" fill="none" stroke={navy} strokeWidth="2.2" />
      <circle cx="32.5" cy="32.5" r="8.2" fill={tone === "dark" ? "#142B4A" : "#F4F7F9"} stroke={teal} strokeWidth="2.2" />
      <path d="M29.4 32.6 31.6 34.8 35.8 29.8" fill="none" stroke={teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Icra360Logo({ className, variant = "horizontal", tone = "light" }: LogoProps) {
  const word = tone === "dark" ? "text-white" : "text-navy";
  const accent = "text-teal";
  if (variant === "icon") {
    return <Icra360Mark className={className} tone={tone} />;
  }
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Icra360Mark tone={tone} />
      <span className={cn("text-[1.35rem] font-semibold tracking-tight", word)}>
        İcra<span className={accent}>360</span>
      </span>
    </span>
  );
}
