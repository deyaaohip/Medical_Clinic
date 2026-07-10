import { NextResponse } from "next/server";
import { ClinicalOperationsService } from "@/core/application/ClinicalOperationsService";

const service = new ClinicalOperationsService();

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const prescription = await service.verifyPrescription(token);
    if (!prescription) {
      return NextResponse.json({ success: false, verified: false, error: "Prescription verification token is invalid." }, { status: 404 });
    }
    return NextResponse.json({ success: true, verified: true, data: prescription });
  } catch (error: any) {
    return NextResponse.json({ success: false, verified: false, error: error.message || "Verification failed." }, { status: 500 });
  }
}
