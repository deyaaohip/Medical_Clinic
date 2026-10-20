import { NextRequest, NextResponse } from "next/server";
import { FinanceInventoryAIService } from "@/core/application/FinanceInventoryAIService";
import { DiagnosticRevenueService } from "@/core/application/DiagnosticRevenueService";
import { authorizeTenant } from "@/lib/auth/tenant-access";

const service = new FinanceInventoryAIService();
const revenueService = new DiagnosticRevenueService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const { tenantId, module } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const status = request.nextUrl.searchParams.get("status") || "all";
    const search = request.nextUrl.searchParams.get("search") || "";
    switch (module) {
      case "finance-dashboard": return NextResponse.json({ success: true, metrics: await service.financeDashboard(access.tenantId) });
      case "invoices": return NextResponse.json({ success: true, data: await service.getInvoices(access.tenantId, status) });
      case "payments": return NextResponse.json({ success: true, data: await service.getPayments(access.tenantId) });
      case "financial-packages": return NextResponse.json({ success: true, data: await service.getFinancialPackages(access.tenantId) });
      case "inventory-dashboard": return NextResponse.json({ success: true, metrics: await service.inventoryDashboard(access.tenantId) });
      case "stock": return NextResponse.json({ success: true, data: await service.getStock(access.tenantId, search) });
      case "suppliers": return NextResponse.json({ success: true, data: await service.getSuppliers(access.tenantId) });
      case "warehouses": return NextResponse.json({ success: true, data: await service.getWarehouses(access.tenantId) });
      case "purchase-orders": return NextResponse.json({ success: true, data: await service.getPurchaseOrders(access.tenantId) });
      case "transfers": return NextResponse.json({ success: true, data: await service.getTransfers(access.tenantId) });
      case "ai-features": return NextResponse.json({ success: true, data: await service.getAIFeatures(access.tenantId) });
      case "ai-actions": return NextResponse.json({ success: true, data: await service.getAIActions(access.tenantId) });
      case "insurance": return NextResponse.json({ success: true, data: await revenueService.getInsuranceDashboard(access.tenantId) });
      default: return NextResponse.json({ success: false, error: "Unknown operations module" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Operations GET API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Query failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const { tenantId, module } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const body = await request.json();
    switch (module) {
      case "invoices": return NextResponse.json({ success: true, data: await service.createInvoice(access.tenantId, body) });
      case "payments": return NextResponse.json({ success: true, data: await service.createPayment(access.tenantId, body) });
      case "stock": return NextResponse.json({ success: true, data: await service.createInventoryItem(access.tenantId, body) });
      case "ai-actions": return NextResponse.json({ success: true, data: await service.runAIAction(access.tenantId, body) });
      case "insurance":
        return NextResponse.json({
          success: true,
          data: await revenueService.createInsuranceEntity(access.tenantId, body.entityType, body, access.session.userId),
        });
      default: return NextResponse.json({ success: false, error: "Unsupported create operation" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Operations POST API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Create failed" }, { status: 500 });
  }
}
