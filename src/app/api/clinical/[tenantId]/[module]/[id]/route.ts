import { NextRequest, NextResponse } from "next/server";
import { ClinicalOperationsService } from "@/core/application/ClinicalOperationsService";
import { authorizeTenant } from "@/lib/auth/tenant-access";

const service = new ClinicalOperationsService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }
) {
  try {
    const { tenantId, module, id } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    if (module === "emr") {
      return NextResponse.json({ success: true, data: await service.getEncounterDetail(access.tenantId, id) });
    }
    return NextResponse.json({ success: false, error: "Detail endpoint not supported." }, { status: 404 });
  } catch (error: any) {
    console.error("Clinical detail API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Detail query failed." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }
) {
  try {
    const { tenantId, module, id } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const body = await request.json();

    if (module === "emr" && body.action === "sign") {
      return NextResponse.json({
        success: true,
        data: await service.signEncounter(access.tenantId, id, body.signature, access.session.userId),
      });
    }
    if (module === "prescriptions" && body.action === "refill") {
      return NextResponse.json({ success: true, data: await service.refillPrescription(access.tenantId, id, access.session.userId) });
    }
    if (module === "laboratory") {
      return NextResponse.json({ success: true, data: await service.updateLabOrder(access.tenantId, id, body, access.session.userId) });
    }

    return NextResponse.json({ success: false, error: "Clinical transition is unsupported." }, { status: 404 });
  } catch (error: any) {
    console.error("Clinical PATCH API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Clinical transition failed." }, { status: 500 });
  }
}
