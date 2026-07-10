import { NextRequest, NextResponse } from "next/server";
import { ClinicalOperationsService } from "@/core/application/ClinicalOperationsService";
import { getSession } from "@/lib/auth/session";

const service = new ClinicalOperationsService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; module: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Clinical authentication required." }, { status: 401 });
    const { tenantId, module } = await params;
    const query = request.nextUrl.searchParams;

    if (module === "context") {
      return NextResponse.json({ success: true, data: await service.getClinicalContext(tenantId) });
    }
    if (module === "emr") {
      const data = await service.getEncounters(tenantId, query.get("search") || "", query.get("patientId") || undefined);
      return NextResponse.json({ success: true, data });
    }
    if (module === "prescriptions") {
      const data = await service.getPrescriptions(tenantId, query.get("patientId") || undefined);
      return NextResponse.json({ success: true, data });
    }
    if (module === "laboratory") {
      const data = await service.getLabOrders(tenantId, query.get("status") || undefined);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: `Clinical module '${module}' was not found.` }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Clinical query failed." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; module: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Clinical authentication required." }, { status: 401 });
    const { tenantId, module } = await params;
    const body = await request.json();

    if (module === "emr") {
      return NextResponse.json({ success: true, data: await service.createEncounter(tenantId, body, session.userId) });
    }
    if (module === "prescription-safety") {
      return NextResponse.json({
        success: true,
        data: await service.analyzePrescriptionSafety(body.patientId, body.medicineIds || []),
      });
    }
    if (module === "prescriptions") {
      const result = await service.createPrescription(tenantId, body, session.userId);
      return NextResponse.json({ success: !result.blocked, ...result }, { status: result.blocked ? 409 : 200 });
    }
    if (module === "laboratory") {
      return NextResponse.json({ success: true, data: await service.createLabOrder(tenantId, body, session.userId) });
    }

    return NextResponse.json({ success: false, error: `POST for '${module}' is unsupported.` }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Clinical operation failed." }, { status: 500 });
  }
}
