import { NextRequest, NextResponse } from "next/server";
import { ClinicSaaSService } from "@/core/application/ClinicSaaSService";
import { getSession } from "@/lib/auth/session";

const clinicService = new ClinicSaaSService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; action: string; subId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { action, subId } = resolvedParams;

    if (action === "patients") {
      const record = await clinicService.getPatientComprehensiveRecord(subId);
      return NextResponse.json({ success: true, ...record });
    }

    return NextResponse.json({ success: false, error: `Action '${action}' not supported for single item.` }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Query failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; action: string; subId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { action, subId } = resolvedParams;
    const body = await request.json();

    if (action === "appointments") {
      const updated = await clinicService.updateAppointmentStatus(subId, body.status);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: `PATCH for '${action}' not supported.` }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Update failed" }, { status: 500 });
  }
}
