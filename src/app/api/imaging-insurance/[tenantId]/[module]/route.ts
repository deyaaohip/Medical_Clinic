import { NextRequest, NextResponse } from "next/server";
import { ImagingInsuranceService } from "@/core/application/ImagingInsuranceService";
import { getSession } from "@/lib/auth/session";

const service = new ImagingInsuranceService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { tenantId, module } = await params;
    const status = request.nextUrl.searchParams.get("status") || "all";
    const modality = request.nextUrl.searchParams.get("modality") || "all";
    const search = request.nextUrl.searchParams.get("search") || "";
    switch (module) {
      case "radiology": return NextResponse.json({ success: true, data: await service.getRadiologyOrders(tenantId, status, modality, search) });
      case "insurance-dashboard": return NextResponse.json({ success: true, metrics: await service.getInsuranceDashboard(tenantId) });
      case "insurance-companies": return NextResponse.json({ success: true, data: await service.getInsuranceCompanies(tenantId) });
      case "policies": return NextResponse.json({ success: true, data: await service.getPolicies(tenantId) });
      case "approvals": return NextResponse.json({ success: true, data: await service.getApprovalRequests(tenantId, status) });
      case "claims": return NextResponse.json({ success: true, data: await service.getClaims(tenantId, status) });
      default: return NextResponse.json({ success: false, error: "Unknown module" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Query failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { tenantId, module } = await params;
    const body = await request.json();
    switch (module) {
      case "radiology": return NextResponse.json({ success: true, data: await service.createRadiologyOrder(tenantId, body) });
      case "approvals": return NextResponse.json({ success: true, data: await service.createApproval(tenantId, body) });
      case "claims": return NextResponse.json({ success: true, data: await service.createClaim(tenantId, body) });
      default: return NextResponse.json({ success: false, error: "Unsupported create" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Create failed" }, { status: 500 });
  }
}