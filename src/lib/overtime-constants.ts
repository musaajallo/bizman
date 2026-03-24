export const OVERTIME_STATUSES = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export type OvertimeStatus = "pending" | "approved" | "rejected";

export const OVERTIME_TYPES = [
  { value: "standard", label: "Standard (Weekday)", rateMultiplier: 1.5 },
  { value: "weekend", label: "Weekend", rateMultiplier: 2.0 },
  { value: "holiday", label: "Public Holiday", rateMultiplier: 2.5 },
] as const;

export type OvertimeTypeValue = (typeof OVERTIME_TYPES)[number]["value"];

export function calculateOvertimePay(
  basicMonthlySalary: number,
  hours: number,
  overtimeType: OvertimeTypeValue
): { hourlyRate: number; rate: number; pay: number } {
  const hourlyRate = basicMonthlySalary / 173.33;
  const typeConfig = OVERTIME_TYPES.find((t) => t.value === overtimeType);
  const multiplier = typeConfig?.rateMultiplier ?? 1.5;
  const rate = parseFloat((hourlyRate * multiplier).toFixed(2));
  const pay = parseFloat((rate * hours).toFixed(2));
  return { hourlyRate, rate, pay };
}
