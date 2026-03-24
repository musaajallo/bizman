import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Employee {
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: Date | string | null;
  gender: string | null;
  nationality: string | null;
  citizenship: string | null;
  nationalIdNumber: string | null;
  taxIdNumber: string | null;
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
  manager: { firstName: string; lastName: string; jobTitle: string | null; employeeNumber: string } | null;
  directReports: { id: string; firstName: string; lastName: string; jobTitle: string | null; employeeNumber: string }[];
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground min-w-[140px] shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

function fmt(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fmtCurrency(n: number | string | null, currency: string | null) {
  if (!n) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(Number(n));
}

const typeLabels: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", intern: "Intern",
};
const freqLabels: Record<string, string> = {
  monthly: "Monthly", biweekly: "Bi-weekly", weekly: "Weekly",
};
const genderLabels: Record<string, string> = {
  male: "Male", female: "Female", other: "Other", prefer_not_to_say: "Prefer not to say",
};

export function EmployeeProfileSections({ employee }: { employee: Employee }) {
  const currency = employee.currency || "USD";

  return (
    <div className="space-y-4">
      {/* Personal */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
        <CardContent>
          <Row label="Full Name" value={[employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ")} />
          <Row label="Date of Birth" value={fmt(employee.dateOfBirth)} />
          <Row label="Gender" value={employee.gender ? genderLabels[employee.gender] || employee.gender : null} />
          <Row label="Nationality" value={employee.nationality} />
          <Row label="Citizenship" value={employee.citizenship} />
          <Row label="National ID" value={employee.nationalIdNumber} />
          <Row label="Tax ID (TIN)" value={employee.taxIdNumber ? <span className="font-mono">{employee.taxIdNumber}</span> : null} />
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
        <CardContent>
          <Row label="Personal Email" value={employee.personalEmail} />
          <Row label="Personal Phone" value={employee.personalPhone} />
          <Row label="Home Address" value={employee.homeAddress} />
          <Row label="Emergency Contact" value={employee.emergencyContactName
            ? `${employee.emergencyContactName}${employee.emergencyContactRelationship ? ` (${employee.emergencyContactRelationship})` : ""}`
            : null} />
          <Row label="Emergency Phone" value={employee.emergencyContactPhone} />
        </CardContent>
      </Card>

      {/* Employment */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Employment</CardTitle></CardHeader>
        <CardContent>
          <Row label="Job Title" value={employee.jobTitle} />
          <Row label="Department" value={employee.department} />
          <Row label="Unit" value={employee.unit} />
          <Row label="Type" value={typeLabels[employee.employmentType] || employee.employmentType} />
          <Row label="Start Date" value={fmt(employee.startDate)} />
          <Row label="Probation End" value={fmt(employee.probationEndDate)} />
          <Row label="End Date" value={fmt(employee.endDate)} />
          <Row label="Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName} — ${employee.manager.jobTitle || employee.manager.employeeNumber}` : null} />
          {employee.directReports.length > 0 && (
            <Row
              label="Direct Reports"
              value={
                <div className="text-right space-y-0.5">
                  {employee.directReports.map((r) => (
                    <div key={r.id} className="text-xs">{r.firstName} {r.lastName}</div>
                  ))}
                </div>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Compensation</CardTitle></CardHeader>
        <CardContent>
          <Row label="Basic Salary" value={fmtCurrency(employee.basicSalary, currency)} />
          <Row label="Pay Frequency" value={employee.payFrequency ? freqLabels[employee.payFrequency] || employee.payFrequency : null} />
          <Row label="Bank" value={employee.bankName} />
          <Row label="Account Name" value={employee.bankAccountName} />
          <Row label="Account Number" value={employee.bankAccountNumber ? <span className="font-mono">{employee.bankAccountNumber}</span> : null} />
          {employee.housingAllowance && <Row label="Housing Allowance" value={fmtCurrency(employee.housingAllowance, currency)} />}
          {employee.transportAllowance && <Row label="Transport Allowance" value={fmtCurrency(employee.transportAllowance, currency)} />}
          {employee.otherAllowance && <Row label={employee.otherAllowanceLabel || "Other Allowance"} value={fmtCurrency(employee.otherAllowance, currency)} />}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Benefits</CardTitle></CardHeader>
        <CardContent>
          <Row label="Medical Aid" value={employee.hasMedicalAid
            ? `${employee.medicalAidProvider || "Yes"}${employee.medicalAidPlan ? ` — ${employee.medicalAidPlan}` : ""}`
            : "Not enrolled"} />
          <Row label="Pension" value={employee.hasPension
            ? `Enrolled${employee.pensionContribution ? ` — ${employee.pensionContribution}% contribution` : ""}`
            : "Not enrolled"} />
        </CardContent>
      </Card>

      {/* Sizes */}
      {(employee.shirtSize || employee.trouserSize || employee.shoeSize || employee.jacketSize) && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Uniform Sizes</CardTitle></CardHeader>
          <CardContent>
            <Row label="Shirt" value={employee.shirtSize} />
            <Row label="Jacket" value={employee.jacketSize} />
            <Row label="Trousers" value={employee.trouserSize} />
            <Row label="Shoes" value={employee.shoeSize} />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {employee.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Internal Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{employee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
