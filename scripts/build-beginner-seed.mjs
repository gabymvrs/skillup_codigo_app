import { readFile, writeFile } from "node:fs/promises";
const c = JSON.parse(
  await readFile("src/data/beginner-curriculum.json", "utf8"),
);
const literal = (v) =>
  v === null
    ? "null"
    : typeof v === "number"
      ? String(v)
      : "'" + String(v).replaceAll("'", "''") + "'";
const array = (v) => "array[" + v.map(literal).join(",") + "]";
let sql = "begin;\n";
sql += `update public.modules set position=position+100000 where id=any(${array(c.modules.map((m) => m.id))}::uuid[]);\n`;
for (const q of c.questions) {
  const cols = Object.keys(q);
  sql += `insert into public.questions(${cols.join(",")}) values(${cols.map((k) => (["options", "payload"].includes(k) ? literal(JSON.stringify(q[k])) + "::jsonb" : literal(q[k]))).join(",")}) on conflict(id) do nothing;\n`;
  const answer = c.answers[q.id];
  sql += `insert into private.question_answers(question_id,correct_index,expected) values(${literal(q.id)},${typeof answer === "number" ? answer : "null"},${literal(JSON.stringify(answer))}::jsonb) on conflict(question_id) do nothing;\n`;
}
for (const m of c.modules.filter((m) => m.track_id)) {
  const cols = Object.keys(m).filter((k) => k !== "prerequisite_id");
  sql += `insert into public.modules(${cols.join(",")}) values(${cols.map((k) => literal(m[k])).join(",")}) on conflict(id) do nothing;\n`;
}
for (const m of [...c.modules].sort((a, b) => a.position - b.position)) {
  const cols = Object.keys(m).filter((k) => !["id", "track_id"].includes(k));
  sql += `update public.modules set ${cols.map((k) => k + "=" + literal(m[k])).join(",")} where id=${literal(m.id)};\n`;
}
for (const p of c.plans) {
  sql += `update public.lesson_sessions s set stage='practice',updated_at=now() from public.lesson_plans old where old.module_id=s.module_id and s.module_id=${literal(p.module_id)} and s.stage='dynamic' and old.question_ids is distinct from ${array(p.question_ids)}::uuid[];\n`;

  sql += `insert into public.lesson_plans(module_id,level,question_ids,dynamic,resource_ids,pedagogy) values(${literal(p.module_id)},${p.level},${array(p.question_ids)}::uuid[],${literal(JSON.stringify(p.dynamic))}::jsonb,${array(p.resource_ids)}::text[],${literal(JSON.stringify(c.pedagogy[p.module_id]))}::jsonb) on conflict(module_id) do update set level=excluded.level,question_ids=excluded.question_ids,dynamic=excluded.dynamic,resource_ids=excluded.resource_ids,pedagogy=excluded.pedagogy;\n`;
}
await writeFile("supabase/beginner-seed.sql", sql + "commit;\n");
console.log(
  `${c.modules.length} modules, ${c.questions.length} new questions. No attempts, progress or rewards deleted.`,
);
