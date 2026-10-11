import { Icra360Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-navy text-white">
      <section
        className="px-6 pb-10 pt-6"
        style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))" }}
      >
        <Icra360Logo tone="dark" />
        <h1 className="mt-8 text-3xl font-semibold leading-tight tracking-tight">{BRAND.slogan}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">{BRAND.description}</p>
      </section>
      <section className="flex flex-1 flex-col rounded-t-3xl bg-canvas px-6 py-7 text-ink">
        <p className="text-sm font-medium text-navy">Yetkili girişi</p>
        <p className="mb-5 mt-1 text-sm text-navy/65">Sistem hukuki tavsiye vermez. Karar yetkili kullanıcıdadır.</p>
        <LoginForm />
      </section>
    </main>
  );
}
