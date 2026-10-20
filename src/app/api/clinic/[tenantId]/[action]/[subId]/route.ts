import { NextRequest, NextResponse } from "next/server";
import { ClinicSaaSService } from "@/core/application/ClinicSaaSService";
import { authorizeTenant } from "@/lib/auth/tenant-access";

const clinicService = new ClinicSaaSService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; action: string; subId: string }> }
) {
  try {
    const { tenantId, action, subId } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    if (action === "patients") {
      const record = await clinicService.getPatientComprehensiveRecord(access.tenantId, subId);
      if (!record) {
        return NextResponse.json({ success: false, error: "Patient was not found in this clinic." }, { status: 404 });
      }
      return NextResponse.json({ success: true, ...record });
    }

    return NextResponse.json({ success: false, error: `Action '${action}' not supported for single item.` }, { status: 404 });
  } catch (error: any) {
    console.error("Clinic detail API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Query failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; action: string; subId: string }> }
) {
  try {
    const { tenantId, action, subId } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const body = await request.json();

    if (action === "appointments") {
      const updated = await clinicService.updateAppointmentStatus(access.tenantId, subId, body.status);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Appointment was not found in this clinic." }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: `PATCH for '${action}' not supported.` }, { status: 404 });
  } catch (error: any) {
    console.error("Clinic detail PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Update failed" }, { status: 500 });
  }
}
