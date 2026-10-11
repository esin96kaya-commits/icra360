"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const authLost =
    error.message.includes("Oturum gerekli") || error.message.includes("AUTH_REQUIRED");

  useEffect(() => {
    if (authLost) {
      window.location.replace("/login");
    }
  }, [authLost]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center text-ink">
      <p className="text-sm font-medium text-navy">Sayfa yüklenemedi.</p>
      <p className="max-w-xs text-sm text-navy/65">Bağlantıyı yenileyin veya tekrar giriş yapın.</p>
      <button
        type="button"
        className="h-12 rounded-xl bg-navy px-5 text-sm font-medium text-white"
        onClick={() => (authLost ? window.location.replace("/login") : reset())}
      >
        Tekrar dene
      </button>
    </main>
  );
}
