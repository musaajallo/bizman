export const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "study", label: "Study Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "compassionate", label: "Compassionate Leave" },
] as const;

export type LeaveTypeValue = (typeof LEAVE_TYPES)[number]["value"];
