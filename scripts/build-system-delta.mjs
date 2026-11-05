import { readFile, writeFile } from "node:fs/promises";
const c = JSON.parse(await readFile("src/data/beginner-curriculum.json", "utf8"));
const ids = [3020,3021,3022,4009,4010,3030,3031,3032,320,321,322]
  .map((n) => `00000000-0000-4000-8000-${String(n).padStart(12,"0")}`);
const literal = (v) => v === null ? "null" : typeof v === "number" ? String(v) : "'" + String(v).replaceAll("'","''") + "'";
const array = (v) => "array[" + v.map(literal).join(",") + "]";
const qids = new Set(c.plans.filter((p) => ids.includes(p.module_id)).flatMap((p) => p.question_ids));
let sql = "begin;\n";
for (const q of c.questions.filter((q) => qids.has(q.id) && Number(q.id.slice(-5)) >= 20000 && Number(q.id.slice(-5)) < 20100)) {
  const columns = Object.keys(q);
  sql += `insert into public.questions(${columns.join(",")}) values(${columns.map((key) => ["options","payload"].includes(key) ? literal(JSON.stringify(q[key]))+"::jsonb" : literal(q[key])).join(",")}) on conflict(id) do nothing;\n`;
  sql += `insert into private.question_answers(question_id,correct_index,expected) values(${literal(q.id)},${c.answers[q.id]},${literal(JSON.stringify(c.answers[q.id]))}::jsonb) on conflict(question_id) do nothing;\n`;
}
for (const update of (c.question_updates || []).filter((q) => [8007,8008,8011].includes(Number(q.id.slice(-4)))))
  sql += `update public.questions set explanation=${literal(update.explanation)} where id=${literal(update.id)};\n`;
for (const m of c.modules.filter((m) => ids.includes(m.id)))
  sql += `update public.modules set title=${literal(m.title)},body=${literal(m.body)},question_id=${literal(m.question_id)} where id=${literal(m.id)} and position=${m.position} and prerequisite_id is not distinct from ${literal(m.prerequisite_id)}::uuid;\n`;
for (const p of c.plans.filter((p) => ids.includes(p.module_id))) {
  sql += `update public.lesson_sessions s set stage='practice',updated_at=now() from public.lesson_plans old where old.module_id=s.module_id and s.module_id=${literal(p.module_id)} and s.stage='dynamic' and old.question_ids is distinct from ${array(p.question_ids)}::uuid[];\n`;
  sql += `insert into public.lesson_plans(module_id,level,question_ids,dynamic,resource_ids,pedagogy) values(${literal(p.module_id)},${p.level},${array(p.question_ids)}::uuid[],${literal(JSON.stringify(p.dynamic))}::jsonb,${array(p.resource_ids)}::text[],${literal(JSON.stringify(c.pedagogy[p.module_id]))}::jsonb) on conflict(module_id) do update set level=excluded.level,question_ids=excluded.question_ids,dynamic=excluded.dynamic,resource_ids=excluded.resource_ids,pedagogy=excluded.pedagogy;\n`;
}
await writeFile("supabase/system-delta.sql",sql+"commit;\n");
console.log(`${ids.length} stable modules; no position changes, progress or rewards touched.`);
