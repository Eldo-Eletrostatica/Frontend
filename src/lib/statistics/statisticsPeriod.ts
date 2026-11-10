// The Backend filters by whole days in Brasília time and takes the period as
// two YYYY-MM-DD dates, with the end day included.
export interface StatisticsPeriod {
  startDate: string;
  endDate: string;
}

export type PeriodPreset = "currentMonth" | "lastSixMonths" | "currentYear";

export const PERIOD_PRESETS: readonly { id: PeriodPreset; label: string }[] = [
  { id: "currentMonth", label: "Este mês" },
  { id: "lastSixMonths", label: "Últimos 6 meses" },
  { id: "currentYear", label: "Este ano" },
];

export const DEFAULT_PERIOD_PRESET: PeriodPreset = "currentMonth";

// The current month counts as one of the six.
const LAST_SIX_MONTHS_OFFSET = 5;

// Built from the local calendar fields, never from toISOString, which would
// turn a late evening into the next day in UTC.
export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Every preset ends today, so the dashboard shows the period up to now.
export function periodOfPreset(preset: PeriodPreset, today: Date = new Date()): StatisticsPeriod {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayByPreset: Record<PeriodPreset, Date> = {
    currentMonth: new Date(year, month, 1),
    lastSixMonths: new Date(year, month - LAST_SIX_MONTHS_OFFSET, 1),
    currentYear: new Date(year, 0, 1),
  };
  return { startDate: toDateInputValue(firstDayByPreset[preset]), endDate: toDateInputValue(today) };
}

// "2026-10-01" → "01/10/2026", splitting the text so no time zone moves the day.
export function formatDay(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
