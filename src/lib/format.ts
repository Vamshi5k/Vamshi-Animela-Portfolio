const pad2 = (n: number) => String(n).padStart(2, "0");

/** Count label from data: (3, "ROLES") → "03 ROLES" (SPEC §4.1). */
export const formatCount = (n: number, unit: string) => `${pad2(n)} ${unit}`;

/** "2023-08" → year/month numbers. */
export const parseYearMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
};

/** Whole months from `a` to `b` ("2023-08" → "2024-11" = 15). */
export const monthsBetween = (a: string, b: string) => {
  const x = parseYearMonth(a);
  const y = parseYearMonth(b);
  return (y.year - x.year) * 12 + (y.month - x.month);
};

const monthFormat = new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" });

/**
 * "2023-08" → "Aug 2023". Formats a fixed date from data (never the current time), so it is safe
 * to render during prerendering under cacheComponents.
 */
export const formatYearMonth = (ym: string) => {
  const { year, month } = parseYearMonth(ym);
  return monthFormat.format(new Date(Date.UTC(year, month - 1, 1)));
};

/** Section index motif: 1 → "§01" (SPEC §4.1). */
export const formatSectionIndex = (index: number) => `§${pad2(index)}`;

/** Item numbering: (1, 4) → "01 / 04" (SPEC §4.2). */
export const formatItemNumber = (n: number, total: number) => `${pad2(n)} / ${pad2(total)}`;

/** Figure number: 0 → "00". */
export const formatFigure = (n: number) => pad2(n);
