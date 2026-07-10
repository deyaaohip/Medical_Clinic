import { NextRequest, NextResponse } from "next/server";
import { ClinicalOperationsService } from "@/core/application/ClinicalOperationsService";
import { getSession } from "@/lib/auth/session";

const service = new ClinicalOperationsService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Clinical authentication required." }, { status: 401 });
    const { tenantId, module, id } = await params;

    if (module === "emr") {
      return NextResponse.json({ success: true, data: await service.getEncounterDetail(tenantId, id) });
    }
    return NextResponse.json({ success: false, error: "Detail endpoint not supported." }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Detail query failed." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Clinical authentication required." }, { status: 401 });
    const { tenantId, module, id } = await params;
    const body = await request.json();

    if (module === "emr" && body.action === "sign") {
      return NextResponse.json({
        success: true,
        data: await service.signEncounter(tenantId, id, body.signature, session.userId),
      });
    }
    if (module === "prescriptions" && body.action === "refill") {
      return NextResponse.json({ success: true, data: await service.refillPrescription(tenantId, id, session.userId) });
    }
    if (module === "laboratory") {
      return NextResponse.json({ success: true, data: await service.updateLabOrder(tenantId, id, body, session.userId) });
    }

    return NextResponse.json({ success: false, error: "Clinical transition is unsupported." }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Clinical transition failed." }, { status: 500 });
  }
}
