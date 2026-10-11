import type { ReactNode } from "react";

export function LegalNote({ children }: { children?: ReactNode }) {
  return (
    <p className="text-xs leading-5 text-navy/55">
      {children ?? "Sistem hukuki tavsiye vermez. Karar yetkili kullanıcıdadır. Onaysız gönderim yoktur."}
    </p>
  );
}
