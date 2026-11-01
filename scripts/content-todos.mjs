// Lists every TODO, null and empty-array field in src/data so missing content is visible.
// Data files are loaded directly via Node's built-in TypeScript type stripping.
// Rules: a { todo } always fails; a null or empty array fails unless its path is declared
// in content-optional.mjs. --strict: exit 1 on any failure (launch gate).
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { optionalPaths } from "./content-optional.mjs";

const strict = process.argv.includes("--strict");
const dataDir = path.resolve(import.meta.dirname, "../src/data");

const optional = optionalPaths.map((o) => ({
  ...o,
  regex: new RegExp(
    `^${o.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\[\\\*\\\]/g, "\\[[^\\]]+\\]")}$`,
  ),
  matched: false,
}));

/** Returns the optional rule for a path, and records which rules matched any field at all. */
function optionalRule(at) {
  let rule;
  for (const o of optional) {
    if (o.regex.test(at)) {
      o.matched = true;
      rule ??= o;
    }
  }
  return rule;
}

const isTodo = (v) =>
  typeof v === "object" && v !== null && Object.keys(v).length === 1 && typeof v.todo === "string";

// Prefer a readable key (slug, id, name, company, title) over a bare index for array items.
const itemKey = (item, i) =>
  (item && typeof item === "object" && (item.slug ?? item.id ?? item.name ?? item.company ?? item.title)) || i;

function gap(at, value) {
  const rule = optionalRule(at);
  const what = value === null ? "null" : "empty";
  return rule
    ? { at, kind: "optional, OK", note: `${what}: ${rule.reason}` }
    : { at, kind: "missing", note: `${what}, required` };
}

function walk(value, at, out) {
  if (isTodo(value)) {
    optionalRule(at);
    out.push({ at, kind: "TODO", note: value.todo });
  } else if (value === null) out.push(gap(at, value));
  else if (Array.isArray(value)) {
    if (value.length === 0) out.push(gap(at, value));
    else optionalRule(at);
    value.forEach((item, i) => walk(item, `${at}[${itemKey(item, i)}]`, out));
  } else {
    optionalRule(at);
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, `${at}.${k}`, out);
    }
  }
}

const files = (await readdir(dataDir)).filter((f) => f.endsWith(".ts") && f !== "types.ts").sort();
const counts = { TODO: 0, missing: 0, "optional, OK": 0 };

for (const file of files) {
  const mod = await import(pathToFileURL(path.join(dataDir, file)).href);
  const found = [];
  for (const [name, value] of Object.entries(mod)) walk(value, name, found);
  if (found.length === 0) continue;

  console.log(`\n${file}`);
  const width = Math.max(...found.map((f) => f.at.length));
  for (const { at, kind, note } of found) {
    counts[kind]++;
    console.log(`  ${at.padEnd(width)}  ${kind.padEnd(12)}  ${note}`);
  }
}

for (const o of optional) {
  if (!o.matched) console.warn(`\nwarning: optional pattern "${o.pattern}" matches no field`);
}

console.log(
  `\n${counts.TODO} TODO, ${counts.missing} missing required, ${counts["optional, OK"]} optional left empty`,
);

if (strict && counts.TODO + counts.missing > 0) {
  console.error("content:check failed: TODO or missing required fields remain.");
  process.exitCode = 1;
}
