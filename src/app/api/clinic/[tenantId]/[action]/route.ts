import { NextRequest, NextResponse } from "next/server";
import { ClinicSaaSService, TenantOwnershipError } from "@/core/application/ClinicSaaSService";
import { authorizeTenant } from "@/lib/auth/tenant-access";

const clinicService = new ClinicSaaSService();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Ids reach the database, so reject malformed ones instead of failing the query. */
const isInvalidRef = (value: unknown) =>
  value !== undefined && value !== null && value !== "" && value !== "all" && !(typeof value === "string" && UUID_PATTERN.test(value));

const invalidRefResponse = () =>
  NextResponse.json({ success: false, error: "One of the selected records has an invalid identifier." }, { status: 400 });

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string; action: string }> }) {
  try {
    const { tenantId, action } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get("branchId") || undefined;
    if (isInvalidRef(branchId)) return invalidRefResponse();

    switch (action) {
      case "overview": {
        const data = await clinicService.getTenantAndBranches(access.tenantId);
        return NextResponse.json({ success: true, ...data });
      }
      case "staff": {
        const staffType = searchParams.get("staffType") || undefined;
        const data = await clinicService.getStaffProfiles(access.tenantId, branchId, staffType);
        return NextResponse.json({ success: true, data });
      }
      case "departments": {
        const data = await clinicService.getDepartmentsAndRooms(access.tenantId, branchId);
        return NextResponse.json({ success: true, ...data });
      }
      case "working-hours": {
        const hours = await clinicService.getWorkingHours(access.tenantId, branchId);
        const vacations = await clinicService.getVacations(access.tenantId, branchId);
        return NextResponse.json({ success: true, workingHours: hours, vacations });
      }
      case "patients": {
        const q = searchParams.get("search") || "";
        const data = await clinicService.getPatients(access.tenantId, branchId, q);
        return NextResponse.json({ success: true, data });
      }
      case "appointments": {
        const status = searchParams.get("status") || undefined;
        const doctorId = searchParams.get("doctorId") || undefined;
        if (isInvalidRef(doctorId)) return invalidRefResponse();
        const startStr = searchParams.get("startDate");
        const endStr = searchParams.get("endDate");
        const dateRange = startStr && endStr ? { start: new Date(startStr), end: new Date(endStr) } : undefined;

        const data = await clinicService.getAppointments(access.tenantId, branchId, dateRange, status, doctorId);
        return NextResponse.json({ success: true, data });
      }
      case "queues": {
        const data = await clinicService.getLiveQueues(access.tenantId, branchId);
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
    const { tenantId, action } = await params;
    const access = await authorizeTenant(tenantId);
    if (!access.ok) return access.response;

    const body = await request.json();

    const refs = [body.branchId, body.patientId, body.doctorId, body.departmentId, body.sourcePatientId, body.targetPatientId];
    if (refs.some(isInvalidRef)) return invalidRefResponse();

    switch (action) {
      case "patients": {
        if (!body.branchId || body.branchId === "all") {
          return NextResponse.json({ success: false, error: "A clinic branch is required." }, { status: 400 });
        }
        const created = await clinicService.createPatient(body, access.tenantId, body.branchId);
        return NextResponse.json({ success: true, data: created });
      }
      case "merge-patients": {
        const result = await clinicService.mergePatients(body.sourcePatientId, body.targetPatientId, access.tenantId);
        return NextResponse.json({ ...result });
      }
      case "appointments": {
        const created = await clinicService.createAppointment(body, access.tenantId, body.branchId);
        return NextResponse.json({ success: true, data: created });
      }
      default:
        return NextResponse.json({ success: false, error: `POST action '${action}' not supported.` }, { status: 404 });
    }
  } catch (error: any) {
    if (error instanceof TenantOwnershipError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Clinic POST API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Operation failed" }, { status: 500 });
  }
}
