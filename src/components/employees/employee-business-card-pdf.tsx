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
    logoUrl?: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  };
}

export function EmployeeBusinessCardPdf({ employee, tenant }: Props) {
  const color = tenant.accentColor || tenant.primaryColor || "#4F6EF7";
  const initials = `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();

  const shared = StyleSheet.create({
    page: {
      width: "3.5in",
      height: "2in",
      padding: 0,
      backgroundColor: "#ffffff",
      fontFamily: "Helvetica",
    },
  });

  const front = StyleSheet.create({
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

  const back = StyleSheet.create({
    page: {
      width: "3.5in",
      height: "2in",
      padding: 0,
      backgroundColor: color,
      fontFamily: "Helvetica",
    },
    // Decorative circles
    circleTopRight: {
      position: "absolute",
      top: -36,
      right: -36,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#ffffff",
      opacity: 0.1,
    },
    circleBottomLeft: {
      position: "absolute",
      bottom: -48,
      left: -48,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: "#ffffff",
      opacity: 0.1,
    },
    bottomStrip: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 6,
      backgroundColor: "rgba(0,0,0,0.15)",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
    },
    logo: { height: 30, maxWidth: 140, objectFit: "contain" },
    companyNameLg: {
      color: "#ffffff",
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      textAlign: "center",
    },
    dividerLine: {
      width: 40,
      height: 1,
      backgroundColor: "rgba(255,255,255,0.4)",
      marginVertical: 8,
    },
    tagline: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 7,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    website: {
      color: "rgba(255,255,255,0.4)",
      fontSize: 7,
      textAlign: "center",
      marginTop: 6,
    },
  });

  return (
    <Document>
      {/* ── FRONT ──────────────────────────────────────────────── */}
      <Page size={[252, 144]} style={shared.page}>
        <View style={front.topBar} />
        <View style={front.body}>
          <View style={front.photoContainer}>
            {employee.photoUrl ? (
              <Image src={employee.photoUrl} style={front.photo} />
            ) : (
              <View style={front.initialsBox}>
                <Text style={front.initialsText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={front.divider} />
          <View style={front.info}>
            <Text style={front.name}>{employee.firstName} {employee.lastName}</Text>
            {employee.jobTitle && <Text style={front.title}>{employee.jobTitle}</Text>}
            {employee.department && <Text style={front.dept}>{employee.department}</Text>}
            <View style={front.lineDivider} />
            {employee.personalEmail && (
              <View style={front.contactRow}>
                <Text style={front.contactText}>{employee.personalEmail}</Text>
              </View>
            )}
            {employee.personalPhone && (
              <View style={front.contactRow}>
                <Text style={front.contactText}>{employee.personalPhone}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={front.companyName}>{tenant.name}</Text>
      </Page>

      {/* ── BACK ───────────────────────────────────────────────── */}
      <Page size={[252, 144]} style={back.page}>
        <View style={back.circleTopRight} />
        <View style={back.circleBottomLeft} />
        <View style={back.bottomStrip} />
        <View style={back.content}>
          {tenant.logoUrl ? (
            <Image src={tenant.logoUrl} style={back.logo} />
          ) : (
            <Text style={back.companyNameLg}>{tenant.name}</Text>
          )}
          <View style={back.dividerLine} />
          <Text style={back.tagline}>
            {employee.jobTitle ?? tenant.name}
          </Text>
          <Text style={back.website}>
            {tenant.name.toLowerCase().replace(/\s/g, "")}.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}
