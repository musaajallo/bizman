"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEmployee, updateEmployee } from "@/lib/actions/employees";
import { EmployeeAvatar } from "./employee-avatar";
import { CountrySelect } from "@/components/ui/country-select";
import { Camera, Loader2, Save, ChevronLeft, ChevronRight } from "lucide-react";

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  employeeNumber: string;
}

interface EmployeeData {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: Date | string | null;
  gender: string | null;
  nationality: string | null;
  citizenship: string | null;
  nationalIdNumber: string | null;
  taxIdNumber: string | null;
  photoUrl: string | null;
  personalEmail: string | null;
  personalPhone: string | null;
  homeAddress: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  jobTitle: string | null;
  department: string | null;
  unit: string | null;
  employmentType: string;
  startDate: Date | string;
  endDate: Date | string | null;
  probationEndDate: Date | string | null;
  status: string;
  managerId: string | null;
  basicSalary: number | string | null;
  currency: string | null;
  payFrequency: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  hasMedicalAid: boolean;
  medicalAidProvider: string | null;
  medicalAidPlan: string | null;
  hasPension: boolean;
  pensionContribution: number | string | null;
  housingAllowance: number | string | null;
  transportAllowance: number | string | null;
  otherAllowance: number | string | null;
  otherAllowanceLabel: string | null;
  shirtSize: string | null;
  trouserSize: string | null;
  shoeSize: string | null;
  jacketSize: string | null;
  notes: string | null;
}

interface Props {
  tenantId: string;
  managers: Manager[];
  employee?: EmployeeData;
}

const SECTIONS = [
  { id: "personal", label: "Personal" },
  { id: "contact", label: "Contact" },
  { id: "employment", label: "Employment" },
  { id: "compensation", label: "Compensation" },
  { id: "benefits", label: "Benefits" },
  { id: "sizes", label: "Sizes & Notes" },
];

function fmt(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SectionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

export function EmployeeForm({ managers, employee }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [section, setSection] = useState(0);
  const [photo, setPhoto] = useState<string | null>(employee?.photoUrl ?? null);
  const [hasMedical, setHasMedical] = useState(employee?.hasMedicalAid ?? false);
  const [hasPension, setHasPension] = useState(employee?.hasPension ?? false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Photo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (photo) formData.set("photoUrl", photo);
    formData.set("hasMedicalAid", String(hasMedical));
    formData.set("hasPension", String(hasPension));

    startTransition(async () => {
      const result = employee
        ? await updateEmployee(employee.id, formData)
        : await createEmployee(formData);

      if ("error" in result) { setError(result.error ?? "An error occurred"); return; }
      const redirectId = employee ? employee.id : ("id" in result ? result.id : "");
      router.push(`/africs/hr/employees/${redirectId}`);
    });
  }

  const isLast = section === SECTIONS.length - 1;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6 max-w-3xl">
      {/* Photo + name header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <EmployeeAvatar
                firstName={employee?.firstName || "N"}
                lastName={employee?.lastName || "E"}
                photoUrl={photo}
                size="xl"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div>
              <p className="font-semibold text-lg">{employee ? `${employee.firstName} ${employee.lastName}` : "New Employee"}</p>
              <p className="text-sm text-muted-foreground">{employee?.employeeNumber || "Employee number will be auto-assigned"}</p>
              <p className="text-xs text-muted-foreground mt-1">Click the avatar to upload a photo (PNG/JPG, max 2MB)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section nav */}
      <div className="flex gap-1 flex-wrap">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(i)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              section === i
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      {section === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SectionGrid>
              <Field label="First Name" required>
                <Input name="firstName" defaultValue={employee?.firstName} required className="h-9" />
              </Field>
              <Field label="Last Name" required>
                <Input name="lastName" defaultValue={employee?.lastName} required className="h-9" />
              </Field>
              <Field label="Middle Name">
                <Input name="middleName" defaultValue={employee?.middleName ?? ""} className="h-9" />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" name="dateOfBirth" defaultValue={fmt(employee?.dateOfBirth)} className="h-9" />
              </Field>
              <Field label="Gender">
                <select name="gender" defaultValue={employee?.gender ?? ""} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Nationality">
                <CountrySelect name="nationality" value={employee?.nationality} />
              </Field>
              <Field label="Citizenship">
                <CountrySelect name="citizenship" value={employee?.citizenship} />
              </Field>
              <Field label="National ID Number">
                <Input name="nationalIdNumber" defaultValue={employee?.nationalIdNumber ?? ""} className="h-9" />
              </Field>
              <Field label="Tax Identification Number (TIN)">
                <Input name="taxIdNumber" defaultValue={employee?.taxIdNumber ?? ""} className="h-9 font-mono" placeholder="e.g. 1234567890" />
              </Field>
              <Field label="Employee Number">
                <Input name="employeeNumber" defaultValue={employee?.employeeNumber ?? ""} placeholder="Auto-generated if blank" className="h-9 font-mono" />
              </Field>
            </SectionGrid>
          </CardContent>
        </Card>
      )}

      {section === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Contact & Emergency</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SectionGrid>
              <Field label="Personal Email">
                <Input type="email" name="personalEmail" defaultValue={employee?.personalEmail ?? ""} className="h-9" />
              </Field>
              <Field label="Personal Phone">
                <Input name="personalPhone" defaultValue={employee?.personalPhone ?? ""} className="h-9" />
              </Field>
            </SectionGrid>
            <Field label="Home Address">
              <Textarea name="homeAddress" defaultValue={employee?.homeAddress ?? ""} rows={2} className="resize-none" />
            </Field>
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Emergency Contact</p>
              <SectionGrid>
                <Field label="Contact Name">
                  <Input name="emergencyContactName" defaultValue={employee?.emergencyContactName ?? ""} className="h-9" />
                </Field>
                <Field label="Contact Phone">
                  <Input name="emergencyContactPhone" defaultValue={employee?.emergencyContactPhone ?? ""} className="h-9" />
                </Field>
                <Field label="Relationship">
                  <select name="emergencyContactRelationship" defaultValue={employee?.emergencyContactRelationship ?? ""} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </SectionGrid>
            </div>
          </CardContent>
        </Card>
      )}

      {section === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Employment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SectionGrid>
              <Field label="Job Title">
                <Input name="jobTitle" defaultValue={employee?.jobTitle ?? ""} className="h-9" />
              </Field>
              <Field label="Department">
                <Input name="department" defaultValue={employee?.department ?? ""} className="h-9" />
              </Field>
              <Field label="Unit / Sub-unit">
                <Input name="unit" defaultValue={employee?.unit ?? ""} className="h-9" />
              </Field>
              <Field label="Employment Type">
                <select name="employmentType" defaultValue={employee?.employmentType ?? "full_time"} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </Field>
              <Field label="Status">
                <select name="status" defaultValue={employee?.status ?? "active"} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                </select>
              </Field>
              <Field label="Manager">
                <select name="managerId" defaultValue={employee?.managerId ?? ""} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">No manager</option>
                  {managers
                    .filter((m) => m.id !== employee?.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} — {m.jobTitle || m.employeeNumber}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Start Date" required>
                <Input type="date" name="startDate" defaultValue={fmt(employee?.startDate)} required className="h-9" />
              </Field>
              <Field label="Probation End Date">
                <Input type="date" name="probationEndDate" defaultValue={fmt(employee?.probationEndDate)} className="h-9" />
              </Field>
              <Field label="End Date">
                <Input type="date" name="endDate" defaultValue={fmt(employee?.endDate)} className="h-9" />
              </Field>
            </SectionGrid>
          </CardContent>
        </Card>
      )}

      {section === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Compensation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SectionGrid>
              <Field label="Basic Salary">
                <Input type="number" step="0.01" name="basicSalary" defaultValue={employee?.basicSalary?.toString() ?? ""} className="h-9" />
              </Field>
              <Field label="Currency">
                <select name="currency" defaultValue={employee?.currency ?? "USD"} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="USD">USD</option>
                  <option value="GMD">GMD</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                  <option value="NGN">NGN</option>
                  <option value="GHS">GHS</option>
                  <option value="XOF">XOF</option>
                </select>
              </Field>
              <Field label="Pay Frequency">
                <select name="payFrequency" defaultValue={employee?.payFrequency ?? "monthly"} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </Field>
            </SectionGrid>
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bank Details</p>
              <SectionGrid>
                <Field label="Bank Name">
                  <Input name="bankName" defaultValue={employee?.bankName ?? ""} className="h-9" />
                </Field>
                <Field label="Account Name">
                  <Input name="bankAccountName" defaultValue={employee?.bankAccountName ?? ""} className="h-9" />
                </Field>
                <Field label="Account Number">
                  <Input name="bankAccountNumber" defaultValue={employee?.bankAccountNumber ?? ""} className="h-9 font-mono" />
                </Field>
              </SectionGrid>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Allowances</p>
              <SectionGrid>
                <Field label="Housing Allowance">
                  <Input type="number" step="0.01" name="housingAllowance" defaultValue={employee?.housingAllowance?.toString() ?? ""} className="h-9" />
                </Field>
                <Field label="Transport Allowance">
                  <Input type="number" step="0.01" name="transportAllowance" defaultValue={employee?.transportAllowance?.toString() ?? ""} className="h-9" />
                </Field>
                <Field label="Other Allowance">
                  <Input type="number" step="0.01" name="otherAllowance" defaultValue={employee?.otherAllowance?.toString() ?? ""} className="h-9" />
                </Field>
                <Field label="Other Allowance Label">
                  <Input name="otherAllowanceLabel" defaultValue={employee?.otherAllowanceLabel ?? ""} placeholder="e.g. Meal allowance" className="h-9" />
                </Field>
              </SectionGrid>
            </div>
          </CardContent>
        </Card>
      )}

      {section === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Benefits</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Medical Aid */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHasMedical(!hasMedical)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hasMedical ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${hasMedical ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm font-medium">Medical Aid</span>
              </div>
              {hasMedical && (
                <SectionGrid>
                  <Field label="Provider">
                    <Input name="medicalAidProvider" defaultValue={employee?.medicalAidProvider ?? ""} className="h-9" />
                  </Field>
                  <Field label="Plan">
                    <select name="medicalAidPlan" defaultValue={employee?.medicalAidPlan ?? ""} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Select plan</option>
                      <option value="Basic">Basic</option>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Family">Family</option>
                    </select>
                  </Field>
                </SectionGrid>
              )}
            </div>

            {/* Pension */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHasPension(!hasPension)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hasPension ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${hasPension ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm font-medium">Pension / Retirement</span>
              </div>
              {hasPension && (
                <Field label="Employee Contribution (%)">
                  <Input type="number" step="0.01" min="0" max="100" name="pensionContribution" defaultValue={employee?.pensionContribution?.toString() ?? ""} className="h-9 max-w-[160px]" />
                </Field>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {section === 5 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Sizes & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Used for uniform and kit ordering.</p>
            <SectionGrid>
              <Field label="Shirt Size">
                <select name="shirtSize" defaultValue={employee?.shirtSize ?? ""} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">—</option>
                  {["XS","S","M","L","XL","XXL","XXXL"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Jacket Size">
                <select name="jacketSize" defaultValue={employee?.jacketSize ?? ""} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">—</option>
                  {["XS","S","M","L","XL","XXL","XXXL"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Trouser Size">
                <Input name="trouserSize" defaultValue={employee?.trouserSize ?? ""} placeholder="e.g. 32-32" className="h-9" />
              </Field>
              <Field label="Shoe Size">
                <Input name="shoeSize" defaultValue={employee?.shoeSize ?? ""} placeholder="EU size e.g. 43" className="h-9" />
              </Field>
            </SectionGrid>
            <div className="pt-2 border-t">
              <Field label="Internal Notes">
                <Textarea name="notes" defaultValue={employee?.notes ?? ""} rows={4} placeholder="Private HR notes — not visible to the employee" className="resize-none" />
              </Field>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Navigation */}
      <div className="flex items-center justify-between pb-6">
        <Button type="button" variant="outline" size="sm" onClick={() => setSection(Math.max(0, section - 1))} disabled={section === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {isLast ? (
          <Button type="submit" size="sm" disabled={pending} className="gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {employee ? "Save Changes" : "Create Employee"}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={() => setSection(section + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </form>
  );
}
