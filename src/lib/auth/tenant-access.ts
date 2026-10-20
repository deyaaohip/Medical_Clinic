import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tenants, tenantUsers } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import type { MultiTenantSessionPayload } from "@/core/application/AuthService";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Resolves a tenant slug or UUID from the URL into the canonical tenant UUID.
 * The database never trusts the raw URL value: an unknown slug/id resolves to null.
 */
export async function resolveTenantId(slugOrId: string): Promise<string | null> {
  if (!slugOrId) return null;
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(
      and(
        isUuid(slugOrId) ? eq(tenants.id, slugOrId) : eq(tenants.slug, slugOrId.toLowerCase()),
        isNull(tenants.deletedAt)
      )
    )
    .limit(1);
  return tenant?.id ?? null;
}

export async function isTenantMember(tenantId: string, userId: string): Promise<boolean> {
  const [membership] = await db
    .select({ id: tenantUsers.id })
    .from(tenantUsers)
    .where(
      and(
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.userId, userId),
        eq(tenantUsers.isActive, true),
        isNull(tenantUsers.deletedAt)
      )
    )
    .limit(1);
  return Boolean(membership);
}

export type TenantAccessResult =
  | { ok: true; session: MultiTenantSessionPayload; tenantId: string }
  | { ok: false; response: NextResponse };

/**
 * Authorizes an API request against the tenant in the URL.
 * - 401 when there is no session
 * - 404 when the tenant slug/id does not exist (no tenant enumeration)
 * - 403 when the signed-in user is not an active member of that tenant
 * Must be called by every tenant-scoped route handler before touching data.
 */
export async function authorizeTenant(slugOrId: string): Promise<TenantAccessResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 }),
    };
  }

  const tenantId = await resolveTenantId(slugOrId);
  if (!tenantId) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Clinic was not found." }, { status: 404 }),
    };
  }

  if (!session.isSuperAdmin && !(await isTenantMember(tenantId, session.userId))) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "You do not have access to this clinic." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session, tenantId };
}
