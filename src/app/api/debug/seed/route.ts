import { NextResponse } from "next/server";
import { runSeed } from "@/db/seed";

export async function POST() {
  try {
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
