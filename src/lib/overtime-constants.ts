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

export type OvertimeRates = {
  standardRateMultiplier: number;
  weekendRateMultiplier: number;
  holidayRateMultiplier: number;
};

export const DEFAULT_OVERTIME_RATES: OvertimeRates = {
  standardRateMultiplier: 1.5,
  weekendRateMultiplier: 2.0,
  holidayRateMultiplier: 2.5,
};

export function getMultiplier(overtimeType: OvertimeTypeValue, rates: OvertimeRates = DEFAULT_OVERTIME_RATES): number {
  if (overtimeType === "weekend") return rates.weekendRateMultiplier;
  if (overtimeType === "holiday") return rates.holidayRateMultiplier;
  return rates.standardRateMultiplier;
}

export function calculateOvertimePay(
  basicMonthlySalary: number,
  hours: number,
  overtimeType: OvertimeTypeValue,
  rates: OvertimeRates = DEFAULT_OVERTIME_RATES
): { hourlyRate: number; rate: number; pay: number } {
  const hourlyRate = basicMonthlySalary / 173.33;
  const multiplier = getMultiplier(overtimeType, rates);
  const rate = parseFloat((hourlyRate * multiplier).toFixed(2));
  const pay = parseFloat((rate * hours).toFixed(2));
  return { hourlyRate, rate, pay };
}
