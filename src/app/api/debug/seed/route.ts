import { NextResponse } from "next/server";
import { runSeed } from "@/db/seed";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  try {
    // Seeding rewrites demo data, so it is restricted to platform super admins.
    const session = await getSession();
    if (!session?.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Super Admin credentials required." }, { status: 403 });
    }

    await runSeed();
    return NextResponse.json({ success: true, message: "Database successfully seeded!" });
  } catch (error: any) {
    console.error("Seeding failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
