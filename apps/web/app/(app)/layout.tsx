import { AppShell } from "@/components/app-shell";
import { requirePageContext } from "@/lib/context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePageContext();
  return <AppShell ctx={ctx}>{children}</AppShell>;
}
