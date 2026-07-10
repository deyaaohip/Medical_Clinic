import { NextRequest, NextResponse } from "next/server";
import { ImagingInsuranceService } from "@/core/application/ImagingInsuranceService";
import { getSession } from "@/lib/auth/session";

const service = new ImagingInsuranceService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { module, id } = await params;
    const body = await request.json();
    if (module === "radiology") return NextResponse.json({ success: true, data: await service.updateRadiologyStatus(id, body) });
    if (module === "claims" && body.action === "resubmit") return NextResponse.json({ success: true, data: await service.resubmitClaim(id) });
    return NextResponse.json({ success: false, error: "Unsupported update" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Update failed" }, { status: 500 });
  }
}