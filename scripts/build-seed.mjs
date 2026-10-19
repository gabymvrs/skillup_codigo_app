import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import { readFileSync, writeFileSync } from "node:fs";
const source = readFileSync("src/data/catalog.ts", "utf8");
const js = stripTypeScriptTypes(source)
  .replace(
    /import originalMaterials from [^;]+;/,
    "const originalMaterials=__data;",
  )
  .replaceAll("export const ", "const ");
const sandbox = {
  __data: JSON.parse(readFileSync("src/data/legacy-materials.json", "utf8")),
};
const catalog = vm.runInNewContext(
  js + ";({subjects,materials,tracks,modules,questions,demoAnswers});",
  sandbox,
);
const quote = (value) =>
  value === null
    ? "null"
    : typeof value === "boolean"
      ? String(value)
      : typeof value === "number"
        ? String(value)
        : `'${String(value).replaceAll("'", "''")}'`;
let sql =
  "-- Original short study materials retained from the previous implementation.\n-- Optional sample curriculum; no personal profiles, fake companies or credentials.\nbegin;\n";
for (const table of [
  "subjects",
  "materials",
  "tracks",
  "modules",
  "questions",
]) {
  for (const row of catalog[table]) {
    const entries = Object.entries(row);
    sql += `insert into public.${table} (${entries.map(([k]) => k).join(",")}) values (${entries.map(([k, v]) => (Array.isArray(v) ? (k === "options" ? `${quote(JSON.stringify(v))}::jsonb` : `array[${v.map(quote).join(",")}]::text[]`) : quote(v))).join(",")}) on conflict (id) do nothing;\n`;
  }
}
for (const [id, index] of Object.entries(catalog.demoAnswers))
  sql += `insert into private.question_answers(question_id,correct_index) values(${quote(id)},${index}) on conflict(question_id) do nothing;\n`;
sql += "commit;\n";
writeFileSync("supabase/seed.sql", sql);
console.log("Seed generated from the retained curriculum.");
