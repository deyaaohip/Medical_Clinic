import { NextResponse } from "next/server";
import { AuthService } from "@/core/application/AuthService";
import { setSessionCookie } from "@/lib/auth/session";

const authService = new AuthService();

export async function POST(request: Request) {
  try {
    const { email, tenantId } = await request.json();

    // In demo environment, we bypass password check and fetch the user directly
    // Using internal authService with a mock password match or querying user repo
    const user = await authService.authenticate(email, "hashed_password_mock_123");

    if (!user) {
      return NextResponse.json({ success: false, error: "User account not found or inactive" }, { status: 404 });
    }

    const token = await authService.createSessionToken(user, tenantId || null);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user, redirectUrl: user.isSuperAdmin ? "/super-admin" : `/${tenantId || "al-shifa"}/dashboard` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
