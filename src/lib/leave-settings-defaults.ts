export const LEAVE_SETTINGS_DEFAULTS = {
  maternityLeaveDays: 180,
  maternityCanCombineWithAnnual: true,
  paternityLeaveDays: 10,
  paternityCanCombineWithAnnual: true,
  sickLeaveAccrualPerMonth: 1.5,
  annualLeaveDefaultDays: 21,
};

export type LeaveSettingsValues = typeof LEAVE_SETTINGS_DEFAULTS;
