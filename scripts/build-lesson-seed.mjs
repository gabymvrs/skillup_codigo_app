import { readFile, writeFile } from "node:fs/promises";
const plans = JSON.parse(await readFile("src/data/lesson-plans.json", "utf8"));
const resources = JSON.parse(
  await readFile("src/data/learning-resources.json", "utf8"),
);
const literal = (v) => "'" + v.replaceAll("'", "''") + "'";
const array = (values) => "array[" + values.map(literal).join(",") + "]";
const upgrades = JSON.parse(
  await readFile("src/data/foundation-lessons.json", "utf8"),
);
let sql = "begin;\n";
for (const q of upgrades.questions) {
  const values = [
    q.id,
    q.title,
    q.prompt,
    JSON.stringify(q.options),
    q.explanation,
    q.category,
    String(q.xp),
    q.subject_id,
    q.kind,
    JSON.stringify(q.payload || {}),
    q.activity_type,
  ];
  sql += `insert into public.questions(id,title,prompt,options,explanation,category,xp,subject_id,kind,payload,activity_type) values(${values.map(literal).join(",")}) on conflict(id) do nothing;\n`;
  const answer = upgrades.answers[q.id];
  sql += `insert into private.question_answers(question_id,correct_index,expected) values(${literal(q.id)},${q.kind === "choice" ? answer : "null"},${literal(JSON.stringify(answer))}::jsonb) on conflict(question_id) do nothing;\n`;
}
for (const m of upgrades.modules)
  sql += `update public.modules set question_id=${literal(m.question_id)},body=${literal(m.body)} where id=${literal(m.id)} and question_id is null;\n`;

for (const r of resources)
  sql += `insert into public.learning_resources(id,title,publisher,url,kind) values(${[r.id, r.title, r.publisher, r.url, r.kind].map(literal).join(",")}) on conflict(id) do update set title=excluded.title,publisher=excluded.publisher,url=excluded.url,kind=excluded.kind;\n`;
for (const p of plans)
  sql += `insert into public.lesson_plans(module_id,level,question_ids,dynamic,resource_ids) select ${literal(p.module_id)},${p.level},${array(p.question_ids)}::uuid[],${literal(JSON.stringify(p.dynamic))}::jsonb,${array(p.resource_ids)}::text[] where exists(select 1 from public.modules where id=${literal(p.module_id)}) on conflict(module_id) do nothing;\n`;
await writeFile("supabase/lesson-seed.sql", sql + "commit;\n");
console.log(`${plans.length} lesson plans; ${resources.length} resources.`);
