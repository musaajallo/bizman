export interface DepreciationInput {
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  method: string;
  purchaseDate: Date;
  periodDate: Date; // first day of the period month
  accumulatedDepreciation: number;
  unitsThisPeriod?: number;
  totalEstimatedUnits?: number;
}

/** Returns the depreciation amount for a single period. Returns 0 if already fully depreciated. */
export function calculatePeriodDepreciation(input: DepreciationInput): number {
  const bookValue = input.cost - input.accumulatedDepreciation;
  const depreciableBase = bookValue - input.salvageValue;
  if (depreciableBase <= 0) return 0;

  // Pro-rate the first month if the purchase happens mid-month
  const sameMonth =
    input.purchaseDate.getFullYear() === input.periodDate.getFullYear() &&
    input.purchaseDate.getMonth() === input.periodDate.getMonth();
  const daysInMonth = new Date(
    input.purchaseDate.getFullYear(),
    input.purchaseDate.getMonth() + 1,
    0,
  ).getDate();
  const proRate = sameMonth ? (daysInMonth - input.purchaseDate.getDate() + 1) / daysInMonth : 1;

  let amount = 0;

  switch (input.method) {
    case "straight_line": {
      const monthly = (input.cost - input.salvageValue) / input.usefulLifeMonths;
      amount = monthly * proRate;
      break;
    }
    case "double_declining_balance":
    case "declining_balance": {
      const annualRate = 2 / (input.usefulLifeMonths / 12);
      amount = ((bookValue * annualRate) / 12) * proRate;
      break;
    }
    case "units_of_activity": {
      if (!input.unitsThisPeriod || !input.totalEstimatedUnits) return 0;
      const perUnit = (input.cost - input.salvageValue) / input.totalEstimatedUnits;
      amount = perUnit * input.unitsThisPeriod;
      break;
    }
    default:
      return 0;
  }

  // Cannot go below salvage value
  return Math.min(amount, depreciableBase);
}

/** Build a projected depreciation schedule (future periods, no GL posting). */
export function buildDepreciationSchedule(params: {
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  method: string;
  purchaseDate: Date;
  accumulatedDepreciation: number;
  periods: number; // how many future months to project
}): Array<{ month: number; year: number; amount: number; bookValue: number }> {
  const schedule: Array<{ month: number; year: number; amount: number; bookValue: number }> = [];
  let accumulated = params.accumulatedDepreciation;
  const start = new Date(params.purchaseDate);
  start.setDate(1);
  // advance to next month after purchase if mid-month
  start.setMonth(start.getMonth() + 1);

  for (let i = 0; i < params.periods; i++) {
    const periodDate = new Date(start);
    periodDate.setMonth(start.getMonth() + i);

    const amount = calculatePeriodDepreciation({
      cost: params.cost,
      salvageValue: params.salvageValue,
      usefulLifeMonths: params.usefulLifeMonths,
      method: params.method,
      purchaseDate: params.purchaseDate,
      periodDate,
      accumulatedDepreciation: accumulated,
    });

    if (amount <= 0) break;
    accumulated += amount;

    schedule.push({
      month: periodDate.getMonth() + 1,
      year: periodDate.getFullYear(),
      amount,
      bookValue: params.cost - accumulated,
    });
  }

  return schedule;
}
