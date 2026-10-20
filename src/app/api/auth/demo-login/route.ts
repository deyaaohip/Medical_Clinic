import { NextResponse } from "next/server";
import { AuthService } from "@/core/application/AuthService";
import { TenantRepository } from "@/infrastructure/db/TenantRepository";
import { setSessionCookie } from "@/lib/auth/session";

const authService = new AuthService();
const tenantRepo = new TenantRepository();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Persona sign-in for the demo/preview environment.
 * It issues a real session without a password, so it is disabled unless
 * DEMO_AUTH_ENABLED === "1" (set only in the sandbox defaults file).
 */
export async function POST(request: Request) {
  if (process.env.DEMO_AUTH_ENABLED !== "1") {
    return NextResponse.json(
      { success: false, error: "Demo sign-in is disabled on this deployment." },
      { status: 403 }
    );
  }

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

    // Never return the credential hash to the browser.
    const { passwordHash: _passwordHash, ...safeUser } = user;

    return NextResponse.json({ success: true, user: safeUser, redirectUrl: user.isSuperAdmin ? "/super-admin" : `/${tenantId || "al-shifa"}/dashboard` });
  } catch (error: any) {
    console.error("Demo login failed:", error);
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
