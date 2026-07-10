import { NextRequest, NextResponse } from "next/server";
import { SuperAdminService, PaginationParams } from "@/core/application/SuperAdminService";
import { getSession } from "@/lib/auth/session";

const superAdminService = new SuperAdminService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  try {
    // Authenticate & Verify Super Admin
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized access. Super Admin credentials required." }, { status: 403 });
    }

    const resolvedParams = await params;
    const { module } = resolvedParams;
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || "desc";
    const status = searchParams.get("status") || undefined;
    const showDeleted = searchParams.get("showDeleted") === "true";

    const paging: PaginationParams = { page, limit, search, sortBy, sortDir, status, showDeleted };

    switch (module) {
      case "dashboard": {
        const metrics = await superAdminService.getDashboardMetrics();
        const revenueChart = await superAdminService.getRevenueChartData();
        return NextResponse.json({ success: true, metrics, revenueChart });
      }
      case "tenants": {
        const res = await superAdminService.getTenants(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "subscription-plans": {
        const res = await superAdminService.getSubscriptionPlans(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "invoices": {
        const res = await superAdminService.getInvoices(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "coupons": {
        const res = await superAdminService.getCoupons(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "announcements": {
        const res = await superAdminService.getAnnouncements(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "email-templates": {
        const res = await superAdminService.getEmailTemplates();
        return NextResponse.json({ success: true, data: res });
      }
      case "sms-templates": {
        const res = await superAdminService.getSmsTemplates();
        return NextResponse.json({ success: true, data: res });
      }
      case "users": {
        const res = await superAdminService.getUsers(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "system-logs": {
        const res = await superAdminService.getSystemLogs(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "global-settings": {
        const res = await superAdminService.getGlobalSettings();
        return NextResponse.json({ success: true, data: res });
      }
      case "storage": {
        const res = await superAdminService.getStorageFiles(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "ai-usage": {
        const res = await superAdminService.getAiUsageLogs(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "api-keys": {
        const res = await superAdminService.getApiKeys(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "security-rules": {
        const res = await superAdminService.getSecurityRules(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "backups": {
        const res = await superAdminService.getBackups(paging);
        return NextResponse.json({ success: true, ...res });
      }
      case "support-tickets": {
        const res = await superAdminService.getSupportTickets(paging);
        return NextResponse.json({ success: true, ...res });
      }
      default:
        return NextResponse.json({ success: false, error: `Module '${module}' not found.` }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Super Admin GET Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal system error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized access. Super Admin credentials required." }, { status: 403 });
    }

    const resolvedParams = await params;
    const { module } = resolvedParams;
    const body = await request.json();

    switch (module) {
      case "tenants": {
        if (body.action === "bulkSoftDelete") {
          await superAdminService.bulkSoftDeleteTenants(body.ids);
          return NextResponse.json({ success: true, message: "Tenants successfully archived" });
        }
        if (body.action === "bulkRestore") {
          await superAdminService.bulkRestoreTenants(body.ids);
          return NextResponse.json({ success: true, message: "Tenants successfully restored" });
        }
        const created = await superAdminService.createTenant(body);
        return NextResponse.json({ success: true, data: created });
      }
      case "subscription-plans": {
        const created = await superAdminService.createSubscriptionPlan(body);
        return NextResponse.json({ success: true, data: created });
      }
      case "coupons": {
        const created = await superAdminService.createCoupon(body);
        return NextResponse.json({ success: true, data: created });
      }
      case "announcements": {
        const created = await superAdminService.createAnnouncement(body);
        return NextResponse.json({ success: true, data: created });
      }
      case "email-templates": {
        const created = await superAdminService.createEmailTemplate(body);
        return NextResponse.json({ success: true, data: created });
      }
      case "sms-templates": {
        const created = await superAdminService.createSmsTemplate(body);
        return NextResponse.json({ success: true, data: created });
      }
      case "global-settings": {
        const updated = await superAdminService.updateGlobalSetting(body.key, body.value, body.description);
        return NextResponse.json({ success: true, data: updated });
      }
      case "api-keys": {
        const created = await superAdminService.createApiKey(body);
        return NextResponse.json({ success: true, data: created });
      }
      case "security-rules": {
        const created = await superAdminService.createSecurityRule(body);
        return NextResponse.json({ success: true, data: created });
      }
      case "backups": {
        const created = await superAdminService.triggerNewBackup(body.backupName, body.triggerType);
        return NextResponse.json({ success: true, data: created });
      }
      default:
        return NextResponse.json({ success: false, error: `Module '${module}' POST not configured.` }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Super Admin POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to execute operation" }, { status: 500 });
  }
}
