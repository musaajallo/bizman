import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

interface Props {
  employee: {
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    department: string | null;
    personalEmail: string | null;
    personalPhone: string | null;
    photoUrl: string | null;
  };
  tenant: {
    name: string;
    primaryColor: string | null;
    accentColor: string | null;
  };
}

export function EmployeeBusinessCardPdf({ employee, tenant }: Props) {
  const color = tenant.accentColor || tenant.primaryColor || "#4F6EF7";

  const styles = StyleSheet.create({
    page: {
      width: "3.5in",
      height: "2in",
      padding: 0,
      backgroundColor: "#ffffff",
      fontFamily: "Helvetica",
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: color,
    },
    body: {
      flexDirection: "row",
      padding: "14pt 14pt 14pt 14pt",
      paddingTop: 17,
      flex: 1,
      alignItems: "center",
    },
    photoContainer: {
      width: 56,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    photo: { width: 50, height: 50, borderRadius: 25 },
    initialsBox: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: color,
      alignItems: "center",
      justifyContent: "center",
    },
    initialsText: {
      color: "#ffffff",
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
    },
    divider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: `${color}30`,
      marginRight: 12,
    },
    info: { flex: 1 },
    name: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: "#111827",
    },
    title: { fontSize: 8, color: "#6B7280", marginTop: 1 },
    dept: { fontSize: 7, color: "#9CA3AF" },
    lineDivider: { height: 1, backgroundColor: color, marginVertical: 6 },
    contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
    contactText: { fontSize: 7, color: "#6B7280" },
    companyName: {
      position: "absolute",
      bottom: 8,
      right: 10,
      fontSize: 6,
      color: "#9CA3AF",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  });

  const initials = `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();

  return (
    <Document>
      <Page size={[252, 144]} style={styles.page}>
        <View style={styles.topBar} />
        <View style={styles.body}>
          <View style={styles.photoContainer}>
            {employee.photoUrl ? (
              <Image src={employee.photoUrl} style={styles.photo} />
            ) : (
              <View style={styles.initialsBox}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.info}>
            <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
            {employee.jobTitle && <Text style={styles.title}>{employee.jobTitle}</Text>}
            {employee.department && <Text style={styles.dept}>{employee.department}</Text>}
            <View style={styles.lineDivider} />
            {employee.personalEmail && (
              <View style={styles.contactRow}>
                <Text style={styles.contactText}>{employee.personalEmail}</Text>
              </View>
            )}
            {employee.personalPhone && (
              <View style={styles.contactRow}>
                <Text style={styles.contactText}>{employee.personalPhone}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.companyName}>{tenant.name}</Text>
      </Page>
    </Document>
  );
}
