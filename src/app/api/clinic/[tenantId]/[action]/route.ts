import { NextRequest, NextResponse } from "next/server";
import { ClinicSaaSService } from "@/core/application/ClinicSaaSService";
import { getSession } from "@/lib/auth/session";

const clinicService = new ClinicSaaSService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string; action: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized access. Clinical login required." }, { status: 401 });
    }

    const resolvedParams = await params;
    const { tenantId, action } = resolvedParams;
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get("branchId") || undefined;

    switch (action) {
      case "overview": {
        const data = await clinicService.getTenantAndBranches(tenantId);
        return NextResponse.json({ success: true, ...data });
      }
      case "staff": {
        const staffType = searchParams.get("staffType") || undefined;
        const data = await clinicService.getStaffProfiles(tenantId, branchId, staffType);
        return NextResponse.json({ success: true, data });
      }
      case "departments": {
        const data = await clinicService.getDepartmentsAndRooms(tenantId, branchId);
        return NextResponse.json({ success: true, ...data });
      }
      case "working-hours": {
        const hours = await clinicService.getWorkingHours(tenantId, branchId);
        const vacations = await clinicService.getVacations(tenantId, branchId);
        return NextResponse.json({ success: true, workingHours: hours, vacations });
      }
      case "patients": {
        const q = searchParams.get("search") || "";
        const data = await clinicService.getPatients(tenantId, branchId, q);
        return NextResponse.json({ success: true, data });
      }
      case "appointments": {
        const status = searchParams.get("status") || undefined;
        const doctorId = searchParams.get("doctorId") || undefined;
        const startStr = searchParams.get("startDate");
        const endStr = searchParams.get("endDate");
        const dateRange = startStr && endStr ? { start: new Date(startStr), end: new Date(endStr) } : undefined;

        const data = await clinicService.getAppointments(tenantId, branchId, dateRange, status, doctorId);
        return NextResponse.json({ success: true, data });
      }
      case "queues": {
        const data = await clinicService.getLiveQueues(tenantId, branchId);
        return NextResponse.json({ success: true, data });
      }
      default:
        return NextResponse.json({ success: false, error: `Action '${action}' not recognized.` }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Clinic GET API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to execute clinic query" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string; action: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { tenantId, action } = resolvedParams;
    const body = await request.json();

    switch (action) {
      case "patients": {
        const created = await clinicService.createPatient(body, tenantId, body.branchId || "all");
        return NextResponse.json({ success: true, data: created });
      }
      case "merge-patients": {
        const result = await clinicService.mergePatients(body.sourcePatientId, body.targetPatientId, tenantId);
        return NextResponse.json({ ...result });
      }
      case "appointments": {
        const created = await clinicService.createAppointment(body, tenantId, body.branchId);
        return NextResponse.json({ success: true, data: created });
      }
      default:
        return NextResponse.json({ success: false, error: `POST action '${action}' not supported.` }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Clinic POST API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Operation failed" }, { status: 500 });
  }
}
