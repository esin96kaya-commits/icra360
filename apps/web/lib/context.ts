import { cache } from "react";
import { redirect } from "next/navigation";
import { loadTenantContext, UnauthorizedError, type TenantContext } from "@icra360/domain";
import { auth } from "@/auth";

function isAuthRequired(error: unknown): boolean {
  if (error instanceof UnauthorizedError) {
    return true;
  }
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "AUTH_REQUIRED";
}

export const requireContext = cache(async (): Promise<TenantContext> => {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) {
    throw new UnauthorizedError();
  }
  return loadTenantContext(session.user.id, session.user.tenantId);
});

/** Use in App Router pages/layouts. Redirects instead of throwing, so WKWebView never shows Next's crash page. */
export async function requirePageContext(): Promise<TenantContext> {
  try {
    return await requireContext();
  } catch (error) {
    if (isAuthRequired(error)) {
      redirect("/login");
    }
    throw error;
  }
}
