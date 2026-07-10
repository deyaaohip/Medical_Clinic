import { getSession } from "@/lib/auth/session";
import { RbacService } from "@/core/application/RbacService";
import { redirect } from "next/navigation";

const rbacService = new RbacService();

export async function requirePermission(tenantId: string, requiredPermission: string) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const isAuthorized = await rbacService.verifyPermission(tenantId, session.userId, requiredPermission);
  if (!isAuthorized) {
    redirect(`/${tenantId}/unauthorized`);
  }

  return session;
}

export async function hasPermission(tenantId: string, requiredPermission: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  return rbacService.verifyPermission(tenantId, session.userId, requiredPermission);
}
