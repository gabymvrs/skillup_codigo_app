import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import { readFileSync, writeFileSync } from "node:fs";
const source = readFileSync("src/data/catalog.ts", "utf8");
const js = stripTypeScriptTypes(source)
  .replace(
    /import originalMaterials from [^;]+;/,
    "const originalMaterials=__data;",
  )
  .replace(/import enrichment from [^;]+;/, "const enrichment=__extra;")
  .replace(/import practicePacks from [^;]+;/, "const practicePacks=__packs;")
  .replaceAll("export const ", "const ");
const catalog = vm.runInNewContext(
  js +
    ";({subjects,materials,tracks,modules,questions,demoAnswers,exerciseAnswers});",
  {
    __data: JSON.parse(readFileSync("src/data/legacy-materials.json", "utf8")),
    __packs: JSON.parse(readFileSync("src/data/practice-packs.json", "utf8")),
    __extra: JSON.parse(readFileSync("src/data/enrichment.json", "utf8")),
  },
);
const quote = (v) =>
  v === null
    ? "null"
    : typeof v === "boolean" || typeof v === "number"
      ? String(v)
      : `'${String(v).replaceAll("'", "''")}'`;
let sql =
  "-- Optional educational curriculum. Idempotent; preserves existing records and progress.\n-- Apply migration 007 before this seed. No personal profiles or simulated testimonials.\nbegin;\n";
for (const table of ["subjects", "materials", "tracks", "questions", "modules"])
  for (const row of catalog[table]) {
    const entries = Object.entries(row);
    sql += `insert into public.${table} (${entries.map(([k]) => k).join(",")}) values (${entries.map(([k, v]) => (["options", "payload"].includes(k) ? `${quote(JSON.stringify(v))}::jsonb` : Array.isArray(v) ? `array[${v.map(quote).join(",")}]::text[]` : quote(v))).join(",")}) on conflict(id) do nothing;\n`;
  }
for (const [id, index] of Object.entries(catalog.demoAnswers))
  sql += `insert into private.question_answers(question_id,correct_index) values(${quote(id)},${index}) on conflict(question_id) do nothing;\n`;
for (const [id, answer] of Object.entries(catalog.exerciseAnswers))
  sql += `insert into private.question_answers(question_id,correct_index,expected) values(${quote(id)},${typeof answer === "number" ? answer : "null"},${quote(JSON.stringify(answer))}::jsonb) on conflict(question_id) do nothing;\n`;
sql += "commit;\n";
writeFileSync("supabase/seed.sql", sql);
console.log(
  "Curriculum generated: " +
    catalog.questions.length +
    " questions, " +
    catalog.tracks.length +
    " tracks.",
);
