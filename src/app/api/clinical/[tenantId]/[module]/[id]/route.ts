import { NextRequest, NextResponse } from "next/server";
import { ClinicalRecordsService } from "@/core/application/ClinicalRecordsService";
import { getSession } from "@/lib/auth/session";

const service = new ClinicalRecordsService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { module, id } = await params;
    const body = await request.json();
    if (module === "lab-orders") {
      return NextResponse.json({ success: true, data: await service.updateLabOrderStatus(id, body.status) });
    }
    return NextResponse.json({ success: false, error: "Unsupported update operation" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Clinical update failed" }, { status: 500 });
  }
}