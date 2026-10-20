import { NextResponse } from "next/server";
import { AuthService } from "@/core/application/AuthService";
import { TenantRepository } from "@/infrastructure/db/TenantRepository";
import { setSessionCookie } from "@/lib/auth/session";

const authService = new AuthService();
const tenantRepo = new TenantRepository();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const { email, tenantId } = await request.json();

    // In demo environment, we bypass password check and fetch the user directly
    // Using internal authService with a mock password match or querying user repo
    const user = await authService.authenticate(email, "hashed_password_mock_123");

    if (!user) {
      return NextResponse.json({ success: false, error: "User account not found or inactive" }, { status: 404 });
    }

    // The demo portal links use tenant slugs while sessions store tenant ids.
    let activeTenantId: string | null = null;
    if (tenantId) {
      const tenant = UUID_PATTERN.test(tenantId)
        ? await tenantRepo.findById(tenantId)
        : await tenantRepo.findBySlug(tenantId);
      activeTenantId = tenant?.id ?? null;
    }

    const token = await authService.createSessionToken(user, activeTenantId);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user, redirectUrl: user.isSuperAdmin ? "/super-admin" : `/${tenantId || "al-shifa"}/dashboard` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
