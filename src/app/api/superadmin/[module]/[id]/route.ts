import { NextRequest, NextResponse } from "next/server";
import { SuperAdminService } from "@/core/application/SuperAdminService";
import { getSession } from "@/lib/auth/session";

const superAdminService = new SuperAdminService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ module: string; id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { module, id } = resolvedParams;
    const body = await request.json();

    switch (module) {
      case "tenants": {
        const updated = await superAdminService.updateTenant(id, body);
        return NextResponse.json({ success: true, data: updated });
      }
      case "subscription-plans": {
        const updated = await superAdminService.updateSubscriptionPlan(id, body);
        return NextResponse.json({ success: true, data: updated });
      }
      case "email-templates": {
        const updated = await superAdminService.updateEmailTemplate(id, body);
        return NextResponse.json({ success: true, data: updated });
      }
      case "sms-templates": {
        const updated = await superAdminService.updateSmsTemplate(id, body);
        return NextResponse.json({ success: true, data: updated });
      }
      case "support-tickets": {
        const updated = await superAdminService.updateTicketStatus(id, body.status);
        return NextResponse.json({ success: true, data: updated });
      }
      default:
        return NextResponse.json({ success: false, error: `Module '${module}' PATCH not configured.` }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ module: string; id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { module, id } = resolvedParams;

    switch (module) {
      case "tenants":
        await superAdminService.softDeleteTenant(id);
        return NextResponse.json({ success: true, message: "Tenant successfully archived" });
      case "subscription-plans":
        await superAdminService.softDeleteSubscriptionPlan(id);
        return NextResponse.json({ success: true, message: "Subscription plan successfully soft deleted" });
      case "invoices":
        await superAdminService.softDeleteInvoice(id);
        return NextResponse.json({ success: true, message: "Invoice soft deleted" });
      case "coupons":
        await superAdminService.softDeleteCoupon(id);
        return NextResponse.json({ success: true, message: "Coupon archived" });
      case "announcements":
        await superAdminService.softDeleteAnnouncement(id);
        return NextResponse.json({ success: true, message: "Announcement archived" });
      case "users":
        await superAdminService.softDeleteUser(id);
        return NextResponse.json({ success: true, message: "User soft deleted" });
      case "storage":
        await superAdminService.softDeleteStorageFile(id);
        return NextResponse.json({ success: true, message: "Storage reference archived" });
      case "api-keys":
        await superAdminService.softDeleteApiKey(id);
        return NextResponse.json({ success: true, message: "API key disabled & soft deleted" });
      case "security-rules":
        await superAdminService.softDeleteSecurityRule(id);
        return NextResponse.json({ success: true, message: "Security rule disabled" });
      case "backups":
        await superAdminService.softDeleteBackup(id);
        return NextResponse.json({ success: true, message: "Backup archive reference removed" });
      case "support-tickets":
        await superAdminService.softDeleteTicket(id);
        return NextResponse.json({ success: true, message: "Support ticket archived" });
      default:
        return NextResponse.json({ success: false, error: `Module '${module}' DELETE not configured.` }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Deletion failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ module: string; id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { module, id } = resolvedParams;
    const body = await request.json();

    if (body.action === "restore") {
      switch (module) {
        case "tenants":
          await superAdminService.restoreTenant(id);
          return NextResponse.json({ success: true, message: "Tenant restored successfully" });
        case "subscription-plans":
          await superAdminService.restoreSubscriptionPlan(id);
          return NextResponse.json({ success: true, message: "Subscription plan restored successfully" });
        case "invoices":
          await superAdminService.restoreInvoice(id);
          return NextResponse.json({ success: true, message: "Invoice restored" });
        case "coupons":
          await superAdminService.restoreCoupon(id);
          return NextResponse.json({ success: true, message: "Coupon restored" });
        case "announcements":
          await superAdminService.restoreAnnouncement(id);
          return NextResponse.json({ success: true, message: "Announcement active again" });
        case "users":
          await superAdminService.restoreUser(id);
          return NextResponse.json({ success: true, message: "User account restored" });
        case "api-keys":
          await superAdminService.restoreApiKey(id);
          return NextResponse.json({ success: true, message: "API Key restored" });
        case "security-rules":
          await superAdminService.restoreSecurityRule(id);
          return NextResponse.json({ success: true, message: "Security rule restored" });
        case "support-tickets":
          await superAdminService.restoreTicket(id);
          return NextResponse.json({ success: true, message: "Support ticket restored" });
        default:
          return NextResponse.json({ success: false, error: `Restore for '${module}' not configured.` }, { status: 404 });
      }
    }

    return NextResponse.json({ success: false, error: "Action not recognized" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Operation failed" }, { status: 500 });
  }
}
