const pad2 = (n: number) => String(n).padStart(2, "0");

/** Section index motif: 1 → "§01" (SPEC §4.1). */
export const formatSectionIndex = (index: number) => `§${pad2(index)}`;

/** Item numbering: (1, 4) → "01 / 04" (SPEC §4.2). */
export const formatItemNumber = (n: number, total: number) => `${pad2(n)} / ${pad2(total)}`;

/** Figure number: 0 → "00". */
export const formatFigure = (n: number) => pad2(n);
