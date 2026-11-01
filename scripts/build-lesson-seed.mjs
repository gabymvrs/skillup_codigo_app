import { readFile, writeFile } from "node:fs/promises";
const plans = JSON.parse(await readFile("src/data/lesson-plans.json", "utf8"));
const resources = JSON.parse(
  await readFile("src/data/learning-resources.json", "utf8"),
);
const literal = (v) => "'" + v.replaceAll("'", "''") + "'";
const array = (values) => "array[" + values.map(literal).join(",") + "]";
let sql = "begin;\n";
for (const r of resources)
  sql += `insert into public.learning_resources(id,title,publisher,url,kind) values(${[r.id, r.title, r.publisher, r.url, r.kind].map(literal).join(",")}) on conflict(id) do update set title=excluded.title,publisher=excluded.publisher,url=excluded.url,kind=excluded.kind;\n`;
for (const p of plans)
  sql += `insert into public.lesson_plans(module_id,level,question_ids,dynamic,resource_ids) select ${literal(p.module_id)},${p.level},${array(p.question_ids)}::uuid[],${literal(JSON.stringify(p.dynamic))}::jsonb,${array(p.resource_ids)}::text[] where exists(select 1 from public.modules where id=${literal(p.module_id)}) on conflict(module_id) do nothing;\n`;
await writeFile("supabase/lesson-seed.sql", sql + "commit;\n");
console.log(`${plans.length} lesson plans; ${resources.length} resources.`);
