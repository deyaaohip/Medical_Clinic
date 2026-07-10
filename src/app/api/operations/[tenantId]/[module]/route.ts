import { NextRequest, NextResponse } from "next/server";
import { FinanceInventoryAIService } from "@/core/application/FinanceInventoryAIService";
import { getSession } from "@/lib/auth/session";

const service = new FinanceInventoryAIService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string; module: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { tenantId, module } = await params;
    const status = request.nextUrl.searchParams.get("status") || "all";
    const search = request.nextUrl.searchParams.get("search") || "";
    switch (module) {
      case "finance-dashboard": return NextResponse.json({ success: true, metrics: await service.financeDashboard(tenantId) });
      case "invoices": return NextResponse.json({ success: true, data: await service.getInvoices(tenantId, status) });
      case "payments": return NextResponse.json({ success: true, data: await service.getPayments(tenantId) });
      case "financial-packages": return NextResponse.json({ success: true, data: await service.getFinancialPackages(tenantId) });
      case "inventory-dashboard": return NextResponse.json({ success: true, metrics: await service.inventoryDashboard(tenantId) });
      case "stock": return NextResponse.json({ success: true, data: await service.getStock(tenantId, search) });
      case "suppliers": return NextResponse.json({ success: true, data: await service.getSuppliers(tenantId) });
      case "warehouses": return NextResponse.json({ success: true, data: await service.getWarehouses(tenantId) });
      case "purchase-orders": return NextResponse.json({ success: true, data: await service.getPurchaseOrders(tenantId) });
      case "transfers": return NextResponse.json({ success: true, data: await service.getTransfers(tenantId) });
      case "ai-features": return NextResponse.json({ success: true, data: await service.getAIFeatures(tenantId) });
      case "ai-actions": return NextResponse.json({ success: true, data: await service.getAIActions(tenantId) });
      default: return NextResponse.json({ success: false, error: "Unknown operations module" }, { status: 404 });
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
      case "invoices": return NextResponse.json({ success: true, data: await service.createInvoice(tenantId, body) });
      case "payments": return NextResponse.json({ success: true, data: await service.createPayment(tenantId, body) });
      case "stock": return NextResponse.json({ success: true, data: await service.createInventoryItem(tenantId, body) });
      case "ai-actions": return NextResponse.json({ success: true, data: await service.runAIAction(tenantId, body) });
      default: return NextResponse.json({ success: false, error: "Unsupported create operation" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Create failed" }, { status: 500 });
  }
}
