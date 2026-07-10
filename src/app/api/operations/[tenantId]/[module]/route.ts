import { NextRequest, NextResponse } from "next/server";
import { DiagnosticRevenueService } from "@/core/application/DiagnosticRevenueService";
import { getSession } from "@/lib/auth/session";

const service = new DiagnosticRevenueService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    const { tenantId, module } = await params;
    if (module === "context") return NextResponse.json({ success: true, data: await service.getContext(tenantId) });
    if (module === "radiology") return NextResponse.json({ success: true, data: await service.getRadiologyOrders(tenantId, request.nextUrl.searchParams.get("modality") || undefined, request.nextUrl.searchParams.get("patientId") || undefined) });
    if (module === "insurance") return NextResponse.json({ success: true, data: await service.getInsuranceDashboard(tenantId) });
    return NextResponse.json({ success: false, error: "Module was not found." }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Operation query failed." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    const { tenantId, module } = await params;
    const body = await request.json();
    if (module === "radiology") return NextResponse.json({ success: true, data: await service.createRadiologyOrder(tenantId, body, session.userId) });
    if (module === "insurance") return NextResponse.json({ success: true, data: await service.createInsuranceEntity(tenantId, body.entityType, body, session.userId) });
    return NextResponse.json({ success: false, error: "Creation is unsupported." }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Operation failed." }, { status: 500 });
  }
}
