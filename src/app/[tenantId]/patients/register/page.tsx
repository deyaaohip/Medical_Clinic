"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  UserPlus,
  Stethoscope,
  Heart,
  Syringe,
  Pill,
  ShieldCheck,
  Building2,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  SyringeIcon,
} from "lucide-react";

export default function PatientIntakeRegistrationPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [branches, setBranches] = React.useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = React.useState(true);

  // Form Master State
  const [formData, setFormData] = React.useState({
    branchId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "1995-06-15",
    gender: "Male",
    nationalId: "",
    bloodType: "O+",
    smokingStatus: "Non-smoker",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "Spouse",
    preferredLanguage: "en",
    address: "",

    // Initial Baseline EMR
    allergenStr: "",
    chronicStr: "",
    medicationStr: "",
    vaccineStr: "",

    // Encounters Baseline Vitals
    bloodPressure: "120/80",
    heartRate: "72",
    temperature: "37.0",

    // Consent
    portalAgreed: true,
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [successNewPat, setSuccessNewPat] = React.useState<any | null>(null);

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`/api/clinic/${tenantId}/overview`);
        const data = await res.json();
        if (data.success) {
          setBranches(data.branches || []);
          if (data.branches?.[0]) {
            setFormData((prev) => ({ ...prev, branchId: data.branches[0].id }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Format helper arrays for EMR
    const allergies = formData.allergenStr.split(",").filter((s) => s.trim()).map((allergen) => ({ allergen: allergen.trim(), reaction: "Standard Reaction", severity: "High" }));
    const chronicDiseases = formData.chronicStr.split(",").filter((s) => s.trim()).map((disease) => ({ disease: disease.trim(), diagnosedYear: new Date().getFullYear() }));
    const activeMedications = formData.medicationStr.split(",").filter((s) => s.trim()).map((med) => ({ medication: med.trim(), dosage: "As prescribed" }));
    const vaccinations = formData.vaccineStr.split(",").filter((s) => s.trim()).map((vac) => ({ vaccine: vac.trim(), date: new Date().toISOString().split("T")[0] }));

    const tags = ["New Registration"];
    if (allergies.length > 0) tags.push("Allergic");
    if (chronicDiseases.length > 0) tags.push("Chronic Condition");
    if (formData.portalAgreed) tags.push("Patient Portal Active");

    const submissionPayload = {
      ...formData,
      allergies,
      chronicDiseases,
      activeMedications,
      vaccinations,
      tags,
    };

    try {
      const res = await fetch(`/api/clinic/${tenantId}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessNewPat(data.data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(data.error || "Failed to submit patient registration.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reach registration gateway.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (successNewPat) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 mt-10">
        <Card className="border-2 border-emerald-500 bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/30 p-8 rounded-3xl shadow-xl text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 dark:text-slate-50">Patient Successfully Provisioned</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium max-w-md mx-auto">
            A secure multi-tenant cryptographic container and EMR record have been generated with MRN identifier:
          </p>
          <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 font-black font-mono text-2xl text-emerald-600 shadow-inner">
            {successNewPat.medicalRecordNumber}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="py-6 px-8 font-black text-sm"
              onClick={() => {
                setSuccessNewPat(null);
                setFormData({
                  branchId: branches?.[0]?.id || "",
                  firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "1995-06-15", gender: "Male", nationalId: "", bloodType: "O+", smokingStatus: "Non-smoker", emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "Spouse", preferredLanguage: "en", address: "", allergenStr: "", chronicStr: "", medicationStr: "", vaccineStr: "", bloodPressure: "120/80", heartRate: "72", temperature: "37.0", portalAgreed: true,
                });
              }}
            >
              + Register Another Patient
            </Button>
            <Button
              variant="default"
              className="py-6 px-8 font-black text-sm bg-teal-600 hover:bg-teal-700"
              onClick={() => router.push(`/${tenantId}/patients`)}
            >
              Explore Master Patient Directory
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in-0">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="font-extrabold text-xs space-x-1"
          onClick={() => router.push(`/${tenantId}/patients`)}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 rtl:rotate-180" />
          <span>Master Directory</span>
        </Button>
        <Badge variant="success" className="px-3 py-1 text-xs font-black uppercase tracking-widest">
          Intake Registration Wizard
        </Badge>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="p-8 bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 shadow-md border border-teal-400/30">
              <UserPlus className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">Comprehensive Patient Registration</CardTitle>
              <CardDescription className="text-xs text-teal-200/80 mt-1">
                Provision a HIPAA-compliant medical identity, link initial triage vital signs, and enable bidi portal messaging.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Operating Branch Allocation */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 font-black text-sm text-teal-700 dark:text-teal-400 rtl:space-x-reverse">
                <Building2 className="w-4 h-4" />
                <span>1. Primary Healthcare Facility Allocation</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="regBranch" className="text-xs font-extrabold">Select Operating Branch</Label>
                <select
                  id="regBranch"
                  required
                  value={formData.branchId}
                  onChange={(e) => handleChange("branchId", e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 2: Personal Identification Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider flex items-center space-x-2">
                <span>2. Personal Identification & Demographics</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pFirstName" className="text-xs font-extrabold capitalize">First Name</Label>
                  <Input
                    id="pFirstName"
                    required
                    placeholder="e.g. Abdullah"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="text-xs h-10 rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pLastName" className="text-xs font-extrabold capitalize">Last Name / Family Name</Label>
                  <Input
                    id="pLastName"
                    required
                    placeholder="e.g. Al-Mansoor"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="text-xs h-10 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pEmail" className="text-xs font-extrabold capitalize">Patient Email Address</Label>
                  <Input
                    id="pEmail"
                    type="email"
                    required
                    placeholder="e.g. a.mansoor@gmail.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="text-xs h-10 rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pPhone" className="text-xs font-extrabold capitalize">Mobile Relay Phone (+ Count Code)</Label>
                  <Input
                    id="pPhone"
                    type="tel"
                    required
                    placeholder="e.g. +971509988112"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="text-xs font-mono font-extrabold h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pDOB" className="text-xs font-extrabold capitalize">Date of Birth</Label>
                  <Input
                    id="pDOB"
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    className="text-xs font-mono h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pGen" className="text-xs font-extrabold capitalize">Biological Gender</Label>
                  <select
                    id="pGen"
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="Male">Male / ذكر</option>
                    <option value="Female">Female / أنثى</option>
                    <option value="Other">Unspecified / Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pNat" className="text-xs font-extrabold capitalize">National ID / Emirates ID #</Label>
                  <Input
                    id="pNat"
                    placeholder="e.g. 784-1995-1234567-1"
                    value={formData.nationalId}
                    onChange={(e) => handleChange("nationalId", e.target.value)}
                    className="text-xs font-mono font-extrabold h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pBlood" className="text-xs font-extrabold capitalize">Blood Type</Label>
                  <select
                    id="pBlood"
                    value={formData.bloodType}
                    onChange={(e) => handleChange("bloodType", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="A+">A+ Positive</option>
                    <option value="A-">A- Negative</option>
                    <option value="B+">B+ Positive</option>
                    <option value="B-">B- Negative</option>
                    <option value="AB+">AB+ Positive</option>
                    <option value="AB-">AB- Negative</option>
                    <option value="O+">O+ Positive</option>
                    <option value="O-">O- Negative</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pSmoke" className="text-xs font-extrabold capitalize">Smoking Status</Label>
                  <select
                    id="pSmoke"
                    value={formData.smokingStatus}
                    onChange={(e) => handleChange("smokingStatus", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="Non-smoker">Non-smoker / لا يدخن</option>
                    <option value="Former smoker">Former smoker / مقلع</option>
                    <option value="Current smoker">Current active smoker / مدخن</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pLang" className="text-xs font-extrabold capitalize">Preferred Triage Language</Label>
                  <select
                    id="pLang"
                    value={formData.preferredLanguage}
                    onChange={(e) => handleChange("preferredLanguage", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="en">English (LTR Interface)</option>
                    <option value="ar">Arabic (RTL Interface / العربية)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pAddr" className="text-xs font-extrabold capitalize">Residential Address & Suite Villa</Label>
                <Input
                  id="pAddr"
                  placeholder="e.g. Abu Dhabi, Khalidiya, Tower 4, Apt #12"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider flex items-center space-x-2">
                <span>3. Designated Emergency Relay Contact</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="eName" className="text-xs font-extrabold capitalize">Emergency Contact Name</Label>
                  <Input
                    id="eName"
                    placeholder="e.g. Fatima Al-Mansoor"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                    className="text-xs h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ePhone" className="text-xs font-extrabold capitalize">Emergency Relay Phone (+ Code)</Label>
                  <Input
                    id="ePhone"
                    type="tel"
                    placeholder="e.g. +971505554411"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                    className="text-xs font-mono font-extrabold h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eRel" className="text-xs font-extrabold capitalize">Relationship to Patient</Label>
                  <Input
                    id="eRel"
                    placeholder="e.g. Spouse, Father, Mother"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => handleChange("emergencyContactRelation", e.target.value)}
                    className="text-xs h-10 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Initial EMR Bootstrapping */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 font-black text-sm text-cyan-600 dark:text-cyan-400 rtl:space-x-reverse">
                <Stethoscope className="w-4 h-4" />
                <span>4. Baseline EMR & Clinical History Synchronization</span>
              </div>
              <p className="text-xs text-slate-500 font-medium max-w-xl">
                Enter comma-separated strings below to instantly bootstrap the patient's comprehensive EMR arrays in PostgreSQL:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rAlg" className="text-xs font-extrabold capitalize">Known Verified Allergies (NKDA if none)</Label>
                  <Input
                    id="rAlg"
                    placeholder="e.g. Penicillin, Peanuts, Sulfa Drugs"
                    value={formData.allergenStr}
                    onChange={(e) => handleChange("allergenStr", e.target.value)}
                    className="text-xs h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rChr" className="text-xs font-extrabold capitalize">Chronic Medical Conditions / Diseases</Label>
                  <Input
                    id="rChr"
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Mild Asthma"
                    value={formData.chronicStr}
                    onChange={(e) => handleChange("chronicStr", e.target.value)}
                    className="text-xs h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rMed" className="text-xs font-extrabold capitalize">Active Active Daily Prescriptions</Label>
                  <Input
                    id="rMed"
                    placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
                    value={formData.medicationStr}
                    onChange={(e) => handleChange("medicationStr", e.target.value)}
                    className="text-xs h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rVac" className="text-xs font-extrabold capitalize">Verified Vaccinations & Immunizations</Label>
                  <Input
                    id="rVac"
                    placeholder="e.g. COVID-19 Booster, Quadrivalent Influenza"
                    value={formData.vaccineStr}
                    onChange={(e) => handleChange("vaccineStr", e.target.value)}
                    className="text-xs h-10 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Encounters Baseline Triage Vitals */}
            <div className="p-5 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-200 dark:border-teal-900 space-y-3">
              <div className="flex items-center space-x-2 font-black text-sm text-teal-800 dark:text-teal-200 rtl:space-x-reverse">
                <Heart className="w-4 h-4 text-rose-500 fill-current animate-pulse" />
                <span>5. Initial Baseline Intake Triage Vital Signs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rBP" className="text-xs font-bold capitalize">Blood Pressure (mmHg)</Label>
                  <Input
                    id="rBP"
                    placeholder="e.g. 120/80"
                    value={formData.bloodPressure}
                    onChange={(e) => handleChange("bloodPressure", e.target.value)}
                    className="text-xs font-mono h-10 rounded-xl bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rHR" className="text-xs font-bold capitalize">Heart Rate (BPM)</Label>
                  <Input
                    id="rHR"
                    type="number"
                    placeholder="e.g. 72"
                    value={formData.heartRate}
                    onChange={(e) => handleChange("heartRate", e.target.value)}
                    className="text-xs font-mono h-10 rounded-xl bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rTemp" className="text-xs font-bold capitalize">Body Temp (°C)</Label>
                  <Input
                    id="rTemp"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 37.0"
                    value={formData.temperature}
                    onChange={(e) => handleChange("temperature", e.target.value)}
                    className="text-xs font-mono h-10 rounded-xl bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Patient Portal Ready Consent */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black">Patient Portal Ready & Direct Telemedicine agreed</h4>
                  <p className="text-[11px] text-slate-500">
                    Enables high-definition WebRTC video consults and automated automated bilingual WhatsApp reminders.
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.portalAgreed}
                onCheckedChange={(val) => handleChange("portalAgreed", val)}
                className="scale-90"
              />
            </div>

            <CardFooter className="pt-6 px-0 flex justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                type="button"
                className="py-6 px-6 font-extrabold text-xs"
                onClick={() => router.push(`/${tenantId}/patients`)}
                disabled={submitting}
              >
                Cancel Registration
              </Button>
              <Button
                variant="default"
                type="submit"
                className="py-6 px-10 font-black text-sm shadow-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enroll Patient Securely"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
