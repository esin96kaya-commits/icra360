"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RevealNationalId({ canReveal, revealed }: { canReveal: boolean; revealed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  if (!canReveal) {
    return <p className="mt-3 text-xs text-navy/70">Hassas veri görüntüleme yetkiniz yok.</p>;
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="mt-3"
      onClick={() => router.push(revealed ? pathname : `${pathname}?reveal=1`)}
    >
      {revealed ? "Maskele" : "TCKN göster"}
    </Button>
  );
}
