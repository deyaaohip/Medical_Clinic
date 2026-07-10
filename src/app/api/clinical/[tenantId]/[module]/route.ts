import { NextRequest, NextResponse } from "next/server";
import { ClinicalRecordsService } from "@/core/application/ClinicalRecordsService";
import { getSession } from "@/lib/auth/session";

const service = new ClinicalRecordsService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { tenantId, module } = await params;
    const search = request.nextUrl.searchParams.get("search") || "";
    const status = request.nextUrl.searchParams.get("status") || "all";
    switch (module) {
      case "dashboard": return NextResponse.json({ success: true, metrics: await service.getDashboard(tenantId) });
      case "emr": return NextResponse.json({ success: true, data: await service.getEmrTimeline(tenantId, search) });
      case "emr-templates": return NextResponse.json({ success: true, data: await service.getEmrTemplates(tenantId) });
      case "prescriptions": return NextResponse.json({ success: true, data: await service.getPrescriptions(tenantId, search) });
      case "medicines": return NextResponse.json({ success: true, data: await service.getMedicines(tenantId, search) });
      case "prescription-templates": return NextResponse.json({ success: true, data: await service.getPrescriptionTemplates(tenantId) });
      case "lab-orders": return NextResponse.json({ success: true, data: await service.getLabOrders(tenantId, status) });
      case "lab-packages": return NextResponse.json({ success: true, data: await service.getLabPackages(tenantId) });
      default: return NextResponse.json({ success: false, error: "Unknown clinical module" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Clinical query failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { tenantId, module } = await params;
    const body = await request.json();
    switch (module) {
      case "emr": return NextResponse.json({ success: true, data: await service.createEmrEncounter(tenantId, body) });
      case "prescriptions": return NextResponse.json({ success: true, data: await service.createPrescription(tenantId, body) });
      case "lab-orders": return NextResponse.json({ success: true, data: await service.createLabOrder(tenantId, body) });
      default: return NextResponse.json({ success: false, error: "Unsupported create operation" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Clinical create failed" }, { status: 500 });
  }
}