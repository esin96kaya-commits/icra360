"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#F4F7F9] px-6 text-center text-[#18212F]">
        <p className="text-sm font-medium">İcra360 yüklenemedi.</p>
        <p className="max-w-xs text-sm text-[#18212F]/65">Sayfayı yenileyin. Oturum düştüyse tekrar giriş yapın.</p>
        <button
          type="button"
          className="h-12 rounded-xl bg-[#142B4A] px-5 text-sm font-medium text-white"
          onClick={() => reset()}
        >
          Tekrar dene
        </button>
        <button
          type="button"
          className="text-sm text-[#16A6A1] underline"
          onClick={() => {
            window.location.replace("/login");
          }}
        >
          Girişe dön
        </button>
      </body>
    </html>
  );
}
