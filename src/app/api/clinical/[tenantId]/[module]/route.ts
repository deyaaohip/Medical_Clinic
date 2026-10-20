import { NextRequest, NextResponse } from "next/server";
import { ClinicalOperationsService } from "@/core/application/ClinicalOperationsService";
import { authorizeTenant } from "@/lib/auth/tenant-access";

const service = new ClinicalOperationsService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; module: string }> }
) {
  try {
    const { tenantId, module } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const query = request.nextUrl.searchParams;

    if (module === "context") {
      return NextResponse.json({ success: true, data: await service.getClinicalContext(access.tenantId) });
    }
    if (module === "emr") {
      const data = await service.getEncounters(access.tenantId, query.get("search") || "", query.get("patientId") || undefined);
      return NextResponse.json({ success: true, data });
    }
    if (module === "prescriptions") {
      const data = await service.getPrescriptions(access.tenantId, query.get("patientId") || undefined);
      return NextResponse.json({ success: true, data });
    }
    if (module === "laboratory") {
      const data = await service.getLabOrders(access.tenantId, query.get("status") || undefined);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: `Clinical module '${module}' was not found.` }, { status: 404 });
  } catch (error: any) {
    console.error("Clinical GET API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Clinical query failed." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; module: string }> }
) {
  try {
    const { tenantId, module } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const body = await request.json();

    if (module === "emr") {
      return NextResponse.json({ success: true, data: await service.createEncounter(access.tenantId, body, access.session.userId) });
    }
    if (module === "prescription-safety") {
      return NextResponse.json({
        success: true,
        data: await service.analyzePrescriptionSafety(body.patientId, body.medicineIds || []),
      });
    }
    if (module === "prescriptions") {
      const result = await service.createPrescription(access.tenantId, body, access.session.userId);
      return NextResponse.json({ success: !result.blocked, ...result }, { status: result.blocked ? 409 : 200 });
    }
    if (module === "laboratory") {
      return NextResponse.json({ success: true, data: await service.createLabOrder(access.tenantId, body, access.session.userId) });
    }

    return NextResponse.json({ success: false, error: `POST for '${module}' is unsupported.` }, { status: 404 });
  } catch (error: any) {
    console.error("Clinical POST API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Clinical operation failed." }, { status: 500 });
  }
}
