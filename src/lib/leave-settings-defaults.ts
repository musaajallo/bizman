export interface AnnualLeaveTier {
  minYears: number; // inclusive lower bound (integer >= 0)
  days: number;     // entitlement in calendar days (integer >= 1)
}

export const LEAVE_SETTINGS_DEFAULTS = {
  maternityLeaveDays: 180,
  maternityCanCombineWithAnnual: true,
  paternityLeaveDays: 10,
  paternityCanCombineWithAnnual: true,
  sickLeaveAccrualPerMonth: 1.5,
  annualLeaveDefaultDays: 21,
  annualLeaveTiers: [] as AnnualLeaveTier[],
};

export type LeaveSettingsValues = typeof LEAVE_SETTINGS_DEFAULTS;

/**
 * Returns the annual leave entitlement (in days) for an employee based on
 * their start date and the configured service tiers.
 *
 * Falls back to `defaultDays` when:
 * - `startDate` is null/undefined
 * - `tiers` is empty
 * - No tier's minYears is <= yearsOfService
 */
export function getAnnualLeaveEntitlement(
  startDate: Date | null | undefined,
  tiers: AnnualLeaveTier[],
  defaultDays: number,
  referenceDate: Date = new Date()
): number {
  if (!startDate || tiers.length === 0) return defaultDays;

  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsOfService = (referenceDate.getTime() - new Date(startDate).getTime()) / msPerYear;

  // Sort descending so the first match is the highest applicable tier
  const sorted = [...tiers].sort((a, b) => b.minYears - a.minYears);
  const match = sorted.find((t) => yearsOfService >= t.minYears);

  return match ? match.days : defaultDays;
}
