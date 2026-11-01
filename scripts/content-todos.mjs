// Lists every TODO, null and empty-array field in src/data so missing content is visible.
// Data files are loaded directly via Node's built-in TypeScript type stripping.
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dataDir = path.resolve(import.meta.dirname, "../src/data");

const isTodo = (v) =>
  typeof v === "object" && v !== null && Object.keys(v).length === 1 && typeof v.todo === "string";

// Prefer a readable key (slug, id, name, company, title) over a bare index for array items.
const itemKey = (item, i) =>
  (item && typeof item === "object" && (item.slug ?? item.id ?? item.name ?? item.company ?? item.title)) || i;

function walk(value, at, out) {
  if (isTodo(value)) out.push({ at, kind: "TODO", note: value.todo });
  else if (value === null) out.push({ at, kind: "null", note: "" });
  else if (Array.isArray(value)) {
    if (value.length === 0) out.push({ at, kind: "empty", note: "" });
    value.forEach((item, i) => walk(item, `${at}[${itemKey(item, i)}]`, out));
  } else if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, `${at}.${k}`, out);
  }
}

const files = (await readdir(dataDir)).filter((f) => f.endsWith(".ts") && f !== "types.ts").sort();
const counts = { TODO: 0, null: 0, empty: 0 };

for (const file of files) {
  const mod = await import(pathToFileURL(path.join(dataDir, file)).href);
  const found = [];
  for (const [name, value] of Object.entries(mod)) walk(value, name, found);
  if (found.length === 0) continue;

  console.log(`\n${file}`);
  const width = Math.max(...found.map((f) => f.at.length));
  for (const { at, kind, note } of found) {
    counts[kind]++;
    console.log(`  ${at.padEnd(width)}  ${kind.padEnd(5)}  ${note}`);
  }
}

console.log(`\n${counts.TODO} TODO, ${counts.null} null, ${counts.empty} empty`);
