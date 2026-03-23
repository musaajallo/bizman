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

  const styles = StyleSheet.create({
    page: {
      width: "2.13in",
      height: "3.38in",
      padding: 0,
      backgroundColor: "#ffffff",
      fontFamily: "Helvetica",
    },
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
    photoWrapper: {
      alignItems: "center",
      marginTop: -28,
    },
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
    initialsText: {
      color: "#ffffff",
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
    },
    body: {
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      flex: 1,
    },
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
  });

  return (
    <Document>
      <Page size={[153, 243]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {tenant.logoUrl ? (
            <Image src={tenant.logoUrl} style={styles.logo} />
          ) : (
            <Text style={styles.companyName}>{tenant.name}</Text>
          )}
        </View>

        {/* Photo */}
        <View style={styles.photoWrapper}>
          <View style={styles.photoRing}>
            {employee.photoUrl ? (
              <Image src={employee.photoUrl} style={styles.photo} />
            ) : (
              <View style={styles.initialsBox}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
          {employee.jobTitle && <Text style={styles.jobTitle}>{employee.jobTitle}</Text>}
          {employee.department && <Text style={styles.dept}>{employee.department}</Text>}

          <View style={styles.idBox}>
            <Text style={styles.idLabel}>ID</Text>
            <Text style={styles.idNumber}>{employee.employeeNumber}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.validText}>
            Valid: {fmt(employee.startDate)} — {employee.endDate ? fmt(employee.endDate) : "No Expiry"}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
