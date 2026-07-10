import { NextRequest, NextResponse } from "next/server";
import { FinanceInventoryAIService } from "@/core/application/FinanceInventoryAIService";
import { getSession } from "@/lib/auth/session";

const service = new FinanceInventoryAIService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string; id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { module, id } = await params;
    const body = await request.json();
    if (module === "ai-actions" && body.action === "approve") {
      return NextResponse.json({ success: true, data: await service.approveAIAction(id) });
    }
    return NextResponse.json({ success: false, error: "Unsupported update operation" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Update failed" }, { status: 500 });
  }
}