import { NextRequest, NextResponse } from "next/server";
import { FinanceInventoryAIService } from "@/core/application/FinanceInventoryAIService";
import { DiagnosticRevenueService } from "@/core/application/DiagnosticRevenueService";
import { authorizeTenant } from "@/lib/auth/tenant-access";

const service = new FinanceInventoryAIService();
const revenueService = new DiagnosticRevenueService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }) {
  try {
    const { tenantId, module, id } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const body = await request.json();
    if (module === "ai-actions" && body.action === "approve") {
      return NextResponse.json({ success: true, data: await service.approveAIAction(access.tenantId, id) });
    }
    if (module === "insurance-authorization") {
      return NextResponse.json({
        success: true,
        data: await revenueService.transitionInsurance(access.tenantId, "authorization", id, body, access.session.userId),
      });
    }
    if (module === "insurance-claim") {
      return NextResponse.json({
        success: true,
        data: await revenueService.transitionInsurance(access.tenantId, "claim", id, body, access.session.userId),
      });
    }
    return NextResponse.json({ success: false, error: "Unsupported update operation" }, { status: 404 });
  } catch (error: any) {
    console.error("Operations PATCH API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Update failed" }, { status: 500 });
  }
}
