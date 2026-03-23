import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

interface Employee {
  employeeNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  jobTitle: string | null;
  department: string | null;
  unit: string | null;
  employmentType: string;
  status: string;
  leaveType: string | null;
  photoUrl: string | null;
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
  startDate: Date | string;
  endDate: Date | string | null;
  probationEndDate: Date | string | null;
  managerId: string | null;
  basicSalary: number | null;
  currency: string | null;
  payFrequency: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  hasMedicalAid: boolean;
  medicalAidProvider: string | null;
  medicalAidPlan: string | null;
  hasPension: boolean;
  pensionContribution: number | null;
  housingAllowance: number | null;
  transportAllowance: number | null;
  otherAllowance: number | null;
  otherAllowanceLabel: string | null;
  shirtSize: string | null;
  trouserSize: string | null;
  shoeSize: string | null;
  jacketSize: string | null;
  notes: string | null;
  manager?: { firstName: string; lastName: string; jobTitle: string | null } | null;
}

interface Props {
  employee: Employee;
  tenant: {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  };
}

const typeLabels: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", intern: "Intern",
};
const statusLabels: Record<string, string> = {
  active: "Active", on_leave: "On Leave", suspended: "Suspended", terminated: "Terminated", resigned: "Resigned",
};
const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave", sick: "Sick Leave", maternity: "Maternity Leave", paternity: "Paternity Leave",
  study: "Study Leave", unpaid: "Unpaid Leave", compassionate: "Compassionate Leave",
};
const freqLabels: Record<string, string> = {
  monthly: "Monthly", bi_weekly: "Bi-weekly", weekly: "Weekly",
};

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  return `${currency ?? "USD"} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function EmployeeProfilePdf({ employee, tenant }: Props) {
  const color = tenant.accentColor || tenant.primaryColor || "#4F6EF7";
  const initials = `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();

  const statusLabel = employee.status === "on_leave" && employee.leaveType
    ? leaveTypeLabels[employee.leaveType] ?? "On Leave"
    : statusLabels[employee.status] ?? employee.status;

  const s = StyleSheet.create({
    page: { padding: 0, backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 8 },

    // Header bar
    headerBar: {
      backgroundColor: color,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 16,
      gap: 16,
    },
    photoRing: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: "#ffffff", padding: 3,
      alignItems: "center", justifyContent: "center",
    },
    photo: { width: 54, height: 54, borderRadius: 27 },
    initialsBox: {
      width: 54, height: 54, borderRadius: 27,
      backgroundColor: color,
      alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: "#ffffff",
    },
    initialsText: { color: "#ffffff", fontSize: 22, fontFamily: "Helvetica-Bold" },
    headerInfo: { flex: 1 },
    headerName: { color: "#ffffff", fontSize: 16, fontFamily: "Helvetica-Bold" },
    headerTitle: { color: "rgba(255,255,255,0.85)", fontSize: 9, marginTop: 2 },
    headerDept: { color: "rgba(255,255,255,0.7)", fontSize: 8, marginTop: 1 },
    headerMeta: { flexDirection: "row", gap: 12, marginTop: 6, alignItems: "center" },
    headerMetaItem: { color: "rgba(255,255,255,0.9)", fontSize: 7, fontFamily: "Helvetica-Bold" },
    headerMetaSep: { color: "rgba(255,255,255,0.4)", fontSize: 7 },
    headerRight: { alignItems: "flex-end" },
    headerLogo: { height: 24, maxWidth: 80, objectFit: "contain" },
    headerCompany: { color: "rgba(255,255,255,0.85)", fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },
    statusBadge: {
      marginTop: 6, paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
      alignSelf: "flex-end",
    },
    statusText: { color: "#ffffff", fontSize: 7, fontFamily: "Helvetica-Bold" },

    // Body
    body: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },

    // Section
    section: { marginBottom: 14 },
    sectionHeader: {
      flexDirection: "row", alignItems: "center", marginBottom: 6,
      borderBottom: `1.5pt solid ${color}`,
      paddingBottom: 3,
    },
    sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color },

    // Grid
    grid: { flexDirection: "row", flexWrap: "wrap" },
    field: { width: "33.33%", marginBottom: 8, paddingRight: 8 },
    fieldFull: { width: "100%", marginBottom: 8 },
    fieldHalf: { width: "50%", marginBottom: 8, paddingRight: 8 },
    fieldLabel: { fontSize: 6, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
    fieldValue: { fontSize: 8, color: "#111827" },
    fieldValueMono: { fontSize: 8, color: "#111827", fontFamily: "Courier" },
    fieldEmpty: { fontSize: 8, color: "#D1D5DB", fontFamily: "Helvetica-Oblique" },

    // Footer
    footer: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      borderTop: "1pt solid #E5E7EB",
      paddingHorizontal: 24, paddingVertical: 8,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: "#FAFAFA",
    },
    footerText: { fontSize: 6, color: "#9CA3AF" },
    footerIdText: { fontSize: 7, fontFamily: "Courier", color: "#6B7280" },

    // Confidential watermark
    confidential: {
      position: "absolute",
      top: 280,
      left: 0, right: 0,
      textAlign: "center",
      fontSize: 60,
      color: "#F3F4F6",
      fontFamily: "Helvetica-Bold",
      transform: "rotate(-30deg)",
      opacity: 0.08,
    },
  });

  function Field({ label, value, mono, full, half }: {
    label: string; value: string | null | undefined; mono?: boolean; full?: boolean; half?: boolean;
  }) {
    const style = full ? s.fieldFull : half ? s.fieldHalf : s.field;
    return (
      <View style={style}>
        <Text style={s.fieldLabel}>{label}</Text>
        {value ? (
          <Text style={mono ? s.fieldValueMono : s.fieldValue}>{value}</Text>
        ) : (
          <Text style={s.fieldEmpty}>—</Text>
        )}
      </View>
    );
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
        <View style={s.grid}>{children}</View>
      </View>
    );
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ──────────────────────────────────────── */}
        <View style={s.headerBar}>
          <View style={s.photoRing}>
            {employee.photoUrl ? (
              <Image src={employee.photoUrl} style={s.photo} />
            ) : (
              <View style={s.initialsBox}>
                <Text style={s.initialsText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={s.headerInfo}>
            <Text style={s.headerName}>
              {employee.firstName}{employee.middleName ? ` ${employee.middleName}` : ""} {employee.lastName}
            </Text>
            {employee.jobTitle && <Text style={s.headerTitle}>{employee.jobTitle}</Text>}
            {employee.department && (
              <Text style={s.headerDept}>
                {employee.department}{employee.unit ? ` · ${employee.unit}` : ""}
              </Text>
            )}
            <View style={s.headerMeta}>
              <Text style={s.headerMetaItem}>{typeLabels[employee.employmentType] ?? employee.employmentType}</Text>
              <Text style={s.headerMetaSep}>·</Text>
              <Text style={s.headerMetaItem}>Started {fmtDate(employee.startDate)}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} style={s.headerLogo} />
            ) : (
              <Text style={s.headerCompany}>{tenant.name}</Text>
            )}
            <View style={s.statusBadge}>
              <Text style={s.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Body ────────────────────────────────────────── */}
        <View style={s.body}>
          {/* Personal */}
          <Section title="Personal Information">
            <Field label="Employee ID" value={employee.employeeNumber} mono />
            <Field label="Date of Birth" value={fmtDate(employee.dateOfBirth)} />
            <Field label="Gender" value={employee.gender ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1) : null} />
            <Field label="Nationality" value={employee.nationality} />
            <Field label="Citizenship" value={employee.citizenship} />
            <Field label="National ID" value={employee.nationalIdNumber} mono />
            <Field label="Tax ID (TIN)" value={employee.taxIdNumber} mono />
          </Section>

          {/* Contact */}
          <Section title="Contact Information">
            <Field label="Email" value={employee.personalEmail} half />
            <Field label="Phone" value={employee.personalPhone} half mono />
            <Field label="Home Address" value={employee.homeAddress} full />
          </Section>

          {/* Emergency */}
          <Section title="Emergency Contact">
            <Field label="Name" value={employee.emergencyContactName} />
            <Field label="Phone" value={employee.emergencyContactPhone} mono />
            <Field label="Relationship" value={employee.emergencyContactRelationship} />
          </Section>

          {/* Employment */}
          <Section title="Employment Details">
            <Field label="Job Title" value={employee.jobTitle} half />
            <Field label="Department" value={employee.department} half />
            <Field label="Unit" value={employee.unit} />
            <Field label="Employment Type" value={typeLabels[employee.employmentType] ?? employee.employmentType} />
            <Field label="Status" value={statusLabel} />
            <Field label="Start Date" value={fmtDate(employee.startDate)} />
            <Field label="End Date" value={fmtDate(employee.endDate)} />
            <Field label="Probation End" value={fmtDate(employee.probationEndDate)} />
            {employee.manager && (
              <Field
                label="Reports To"
                value={`${employee.manager.firstName} ${employee.manager.lastName}${employee.manager.jobTitle ? ` (${employee.manager.jobTitle})` : ""}`}
                half
              />
            )}
          </Section>

          {/* Compensation */}
          <Section title="Compensation">
            <Field label="Basic Salary" value={fmtCurrency(employee.basicSalary, employee.currency)} />
            <Field label="Pay Frequency" value={freqLabels[employee.payFrequency ?? ""] ?? employee.payFrequency} />
            <Field label="Currency" value={employee.currency} />
            <Field label="Bank Name" value={employee.bankName} />
            <Field label="Account Name" value={employee.bankAccountName} />
            <Field label="Account Number" value={employee.bankAccountNumber} mono />
          </Section>

          {/* Benefits */}
          <Section title="Benefits & Allowances">
            <Field label="Medical Aid" value={employee.hasMedicalAid ? "Yes" : "No"} />
            {employee.hasMedicalAid && (
              <>
                <Field label="Medical Aid Provider" value={employee.medicalAidProvider} />
                <Field label="Medical Aid Plan" value={employee.medicalAidPlan} />
              </>
            )}
            <Field label="Pension" value={employee.hasPension ? "Yes" : "No"} />
            {employee.hasPension && (
              <Field label="Pension Contribution" value={fmtCurrency(employee.pensionContribution, employee.currency)} />
            )}
            <Field label="Housing Allowance" value={fmtCurrency(employee.housingAllowance, employee.currency)} />
            <Field label="Transport Allowance" value={fmtCurrency(employee.transportAllowance, employee.currency)} />
            {employee.otherAllowance && (
              <Field
                label={employee.otherAllowanceLabel ?? "Other Allowance"}
                value={fmtCurrency(employee.otherAllowance, employee.currency)}
              />
            )}
          </Section>

          {/* Sizes */}
          {(employee.shirtSize || employee.trouserSize || employee.shoeSize || employee.jacketSize) && (
            <Section title="Uniform Sizes">
              <Field label="Shirt" value={employee.shirtSize} />
              <Field label="Trouser" value={employee.trouserSize} />
              <Field label="Shoe" value={employee.shoeSize} />
              <Field label="Jacket" value={employee.jacketSize} />
            </Section>
          )}

          {/* Notes */}
          {employee.notes && (
            <Section title="Notes">
              <Field label="Notes" value={employee.notes} full />
            </Section>
          )}
        </View>

        {/* ── Footer ──────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {tenant.name} — Employee Profile — Confidential
          </Text>
          <Text style={s.footerIdText}>{employee.employeeNumber}</Text>
          <Text style={s.footerText}>
            Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
