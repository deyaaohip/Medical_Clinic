import { NextRequest, NextResponse } from "next/server";
import { DiagnosticRevenueService } from "@/core/application/DiagnosticRevenueService";
import { getSession } from "@/lib/auth/session";

const service = new DiagnosticRevenueService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    const { tenantId, module, id } = await params;
    const body = await request.json();
    if (module === "radiology") return NextResponse.json({ success: true, data: await service.updateRadiologyOrder(tenantId, id, body, session.userId) });
    if (module === "insurance-authorization") return NextResponse.json({ success: true, data: await service.transitionInsurance(tenantId, "authorization", id, body, session.userId) });
    if (module === "insurance-claim") return NextResponse.json({ success: true, data: await service.transitionInsurance(tenantId, "claim", id, body, session.userId) });
    return NextResponse.json({ success: false, error: "Transition is unsupported." }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Transition failed." }, { status: 500 });
  }
}
