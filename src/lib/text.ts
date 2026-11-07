// Text helpers for content that is stored as one field but displayed in parts.

/** Tokens that end in a period without ending a sentence (compared lower-case, trailing period removed). */
const ABBREVIATIONS = new Set(["e.g", "i.e", "etc", "vs", "approx", "mr", "mrs", "ms", "dr", "st", "jr", "sr", "inc", "ltd", "co", "no", "fig"]);

/**
 * Splits text at the end of its first sentence: `[lead, rest]`, where `lead + " " + rest` is the original
 * text (whitespace aside) and `rest` is null when there is only one sentence. A boundary is ., ! or ?
 * (plus closing quotes or brackets) followed by whitespace and an uppercase letter, digit or opening quote.
 * Periods inside tokens ("React.js", "v2.1") never qualify because no whitespace follows them; abbreviations,
 * initials ("J. Smith", "U.K.") and numbered references ("No. 5") are skipped.
 */
export function splitLead(text: string): [string, string | null] {
  const boundary = /[.!?]["'”’)\]]*(?=\s+["'“‘(\[]?[A-Z0-9])/g;
  for (let m = boundary.exec(text); m; m = boundary.exec(text)) {
    if (text[m.index] === ".") {
      const token = (text.slice(0, m.index).match(/(\S+)$/)?.[1] ?? "").replace(/^["'“‘(\[]+/, "").toLowerCase();
      const initials = /^(?:[a-z]\.)*[a-z]$/.test(token); // "j", "u.k", "u.s.a"
      const numbered = token === "no" || /^\d+$/.test(token) && /^\s+\d/.test(text.slice(m.index + 1));
      if (ABBREVIATIONS.has(token) || initials || numbered) continue;
    }
    const cut = m.index + m[0].length;
    const rest = text.slice(cut).trim();
    return [text.slice(0, cut).trim(), rest || null];
  }
  return [text.trim(), null];
}
