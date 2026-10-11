import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "horizontal" | "icon";
  tone?: "light" | "dark";
};

export function Logo({ className, variant = "horizontal", tone = "light" }: LogoProps) {
  const src =
    variant === "icon"
      ? tone === "dark"
        ? "/brand/icon-dark.svg"
        : "/brand/icon-light.svg"
      : tone === "dark"
        ? "/brand/logo-horizontal-dark.svg"
        : "/brand/logo-horizontal-light.svg";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="İcra360"
      className={cn(variant === "icon" ? "h-8 w-8" : "h-8 w-auto", className)}
    />
  );
}
