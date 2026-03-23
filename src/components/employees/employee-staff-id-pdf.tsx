import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

interface Props {
  employee: {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    department: string | null;
    photoUrl: string | null;
    startDate: Date | string;
    endDate: Date | string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelationship: string | null;
    personalPhone: string | null;
    personalEmail: string | null;
  };
  tenant: {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  };
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function EmployeeStaffIdPdf({ employee, tenant }: Props) {
  const color = tenant.accentColor || tenant.primaryColor || "#4F6EF7";
  const initials = `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();

  // Shared page size
  const SIZE: [number, number] = [153, 243];

  const s = StyleSheet.create({
    // ── Shared ────────────────────────────────────────────────
    page: {
      width: "2.13in",
      height: "3.38in",
      padding: 0,
      backgroundColor: "#ffffff",
      fontFamily: "Helvetica",
    },

    // ── Front ─────────────────────────────────────────────────
    header: {
      backgroundColor: color,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 60,
    },
    logo: { height: 26, maxWidth: 100, objectFit: "contain" },
    companyName: {
      color: "#ffffff",
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      textAlign: "center",
    },
    photoWrapper: { alignItems: "center", marginTop: -28 },
    photoRing: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      padding: 3,
    },
    photo: { width: 52, height: 52, borderRadius: 26 },
    initialsBox: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: color,
      alignItems: "center",
      justifyContent: "center",
    },
    initialsText: { color: "#ffffff", fontSize: 20, fontFamily: "Helvetica-Bold" },
    body: { alignItems: "center", paddingHorizontal: 12, paddingTop: 8, flex: 1 },
    name: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#111827",
      textAlign: "center",
      marginTop: 4,
    },
    jobTitle: { fontSize: 8, color: "#6B7280", textAlign: "center", marginTop: 2 },
    dept: { fontSize: 7, color: "#9CA3AF", textAlign: "center" },
    idBox: {
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: "#F9FAFB",
      borderRadius: 4,
      alignItems: "center",
      width: "100%",
    },
    idLabel: { fontSize: 6, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1.5 },
    idNumber: {
      fontSize: 11,
      fontFamily: "Courier-Bold",
      letterSpacing: 3,
      color,
      marginTop: 2,
    },
    footer: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      alignItems: "center",
      backgroundColor: `${color}20`,
    },
    validText: { fontSize: 7, color, fontFamily: "Helvetica-Bold" },

    // ── Back ──────────────────────────────────────────────────
    topStrip: { height: 8, backgroundColor: color },
    backBranding: {
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderBottom: "1pt solid #F3F4F6",
    },
    backLogo: { height: 20, maxWidth: 100, objectFit: "contain" },
    backCompanyName: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color,
      textAlign: "center",
    },
    backBody: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
    sectionLabel: {
      fontSize: 6,
      fontFamily: "Helvetica-Bold",
      color,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    contactName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111827" },
    contactSub: { fontSize: 7, color: "#9CA3AF", marginTop: 1 },
    contactPhone: { fontSize: 8, fontFamily: "Courier", color: "#374151", marginTop: 3 },
    dividerLine: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 8 },
    contactText: { fontSize: 8, color: "#6B7280", marginBottom: 1 },
    noInfo: { fontSize: 7, color: "#D1D5DB", fontFamily: "Helvetica-Oblique" },
    backFooter: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderTop: "1pt solid #F3F4F6",
      alignItems: "center",
    },
    returnLabel: { fontSize: 6, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.8 },
    returnCompany: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#374151", marginTop: 1 },
    bottomStrip: { height: 5, backgroundColor: color },
  });

  return (
    <Document>
      {/* ── FRONT ──────────────────────────────────────────────── */}
      <Page size={SIZE} style={s.page}>
        <View style={s.header}>
          {tenant.logoUrl ? (
            <Image src={tenant.logoUrl} style={s.logo} />
          ) : (
            <Text style={s.companyName}>{tenant.name}</Text>
          )}
        </View>

        <View style={s.photoWrapper}>
          <View style={s.photoRing}>
            {employee.photoUrl ? (
              <Image src={employee.photoUrl} style={s.photo} />
            ) : (
              <View style={s.initialsBox}>
                <Text style={s.initialsText}>{initials}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.name}>{employee.firstName} {employee.lastName}</Text>
          {employee.jobTitle && <Text style={s.jobTitle}>{employee.jobTitle}</Text>}
          {employee.department && <Text style={s.dept}>{employee.department}</Text>}
          <View style={s.idBox}>
            <Text style={s.idLabel}>ID</Text>
            <Text style={s.idNumber}>{employee.employeeNumber}</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.validText}>
            Valid: {fmt(employee.startDate)} — {employee.endDate ? fmt(employee.endDate) : "No Expiry"}
          </Text>
        </View>
      </Page>

      {/* ── BACK ───────────────────────────────────────────────── */}
      <Page size={SIZE} style={s.page}>
        <View style={s.topStrip} />

        {/* Company branding */}
        <View style={s.backBranding}>
          {tenant.logoUrl ? (
            <Image src={tenant.logoUrl} style={s.backLogo} />
          ) : (
            <Text style={s.backCompanyName}>{tenant.name}</Text>
          )}
        </View>

        <View style={s.backBody}>
          {/* Emergency Contact */}
          <Text style={s.sectionLabel}>Emergency Contact</Text>
          {employee.emergencyContactName ? (
            <>
              <Text style={s.contactName}>{employee.emergencyContactName}</Text>
              {employee.emergencyContactRelationship && (
                <Text style={s.contactSub}>{employee.emergencyContactRelationship}</Text>
              )}
              {employee.emergencyContactPhone && (
                <Text style={s.contactPhone}>{employee.emergencyContactPhone}</Text>
              )}
            </>
          ) : (
            <Text style={s.noInfo}>Not specified</Text>
          )}

          <View style={s.dividerLine} />

          {/* Employee Contact */}
          <Text style={s.sectionLabel}>Employee Contact</Text>
          {employee.personalPhone ? (
            <Text style={s.contactText}>{employee.personalPhone}</Text>
          ) : null}
          {employee.personalEmail ? (
            <Text style={s.contactText}>{employee.personalEmail}</Text>
          ) : null}
          {!employee.personalPhone && !employee.personalEmail && (
            <Text style={s.noInfo}>Not specified</Text>
          )}
        </View>

        <View style={s.backFooter}>
          <Text style={s.returnLabel}>If found, please return to</Text>
          <Text style={s.returnCompany}>{tenant.name}</Text>
        </View>

        <View style={s.bottomStrip} />
      </Page>
    </Document>
  );
}
