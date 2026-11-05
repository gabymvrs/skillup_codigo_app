import { readFile, writeFile } from "node:fs/promises";

// Restricted production delta. beginner-seed.sql is only for a fresh local setup.
const c = JSON.parse(await readFile("src/data/beginner-curriculum.json", "utf8"));
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ids = [3040,3041,3042,4011,4012,3060,3061,3062,4015,4016,3070,3071,3072,4017,4018].map(uid);
const updateIds = [8014,8018,8019,8020,8022,8023,12017].map(uid);
const literal = (v) => v === null ? "null" : typeof v === "number" ? String(v) : "'" + String(v).replaceAll("'", "''") + "'";
const array = (v) => "array[" + v.map(literal).join(",") + "]";
const selected = c.modules.filter((m) => ids.includes(m.id));
const plans = c.plans.filter((p) => ids.includes(p.module_id));
if (selected.length !== 15 || plans.length !== 15) throw new Error("Run extend-pending-tracks.mjs first: expected all 15 original lessons.");
const questionIds = new Set(plans.flatMap((p) => p.question_ids));
const newQuestions = c.questions.filter((q) => questionIds.has(q.id) && Number(q.id.slice(-5)) >= 21000 && Number(q.id.slice(-5)) < 21100);
if (newQuestions.length !== 60) throw new Error("Expected exactly 60 questions in the reserved 21000–21099 range.");
let sql = "-- Restricted delta for 15 original Logistics, Biology and Physics lessons.\n-- Keep existing progress, attempts, rewards, XP, positions and prerequisites.\n-- Do not apply beginner-seed.sql to production.\nbegin;\n";
// Fail closed rather than silently skipping a module whose ordering has changed.
sql += "do $pending$\nbegin\n";
for (const m of selected) {
  sql += `  if not exists(select 1 from public.modules where id=${literal(m.id)} and position=${m.position} and prerequisite_id is not distinct from ${literal(m.prerequisite_id)}::uuid) then\n    raise exception 'Pending curriculum precondition failed for module ${m.id}: missing module or changed position/prerequisite';\n  end if;\n`;
}
for (const p of plans) {
  sql += `  if not exists(select 1 from public.lesson_plans where module_id=${literal(p.module_id)}) then\n    raise exception 'Pending curriculum precondition failed: missing original plan ${p.module_id}';\n  end if;\n`;
}
const originals = [...new Set(plans.flatMap((p) => p.question_ids).filter((qid) => !newQuestions.some((q) => q.id === qid)))];
for (const qid of originals) {
  sql += `  if not exists(select 1 from public.questions where id=${literal(qid)}) then\n    raise exception 'Pending curriculum precondition failed: missing original question ${qid}';\n  end if;\n`;
}
sql += "end\n$pending$;\n";
for (const q of newQuestions) {
  const columns = Object.keys(q);
  sql += `insert into public.questions(${columns.join(",")}) values(${columns.map((key) => ["options", "payload"].includes(key) ? literal(JSON.stringify(q[key])) + "::jsonb" : literal(q[key])).join(",")}) on conflict(id) do nothing;\n`;
  sql += `insert into private.question_answers(question_id,correct_index,expected) values(${literal(q.id)},${c.answers[q.id]},${literal(JSON.stringify(c.answers[q.id]))}::jsonb) on conflict(question_id) do nothing;\n`;
}
for (const update of (c.question_updates || []).filter((q) => updateIds.includes(q.id))) {
  const fields = Object.keys(update).filter((key) => key !== "id");
  sql += `update public.questions set ${fields.map((key) => `${key}=${literal(update[key])}`).join(",")} where id=${literal(update.id)};\n`;
}
for (const m of selected)
  sql += `update public.modules set title=${literal(m.title)},body=${literal(m.body)},question_id=${literal(m.question_id)} where id=${literal(m.id)};\n`;
for (const p of plans) {
  // Reopen only the practice of unfinished sessions whose question list changed.
  // Results/drafts stay in place; completed sessions and their rewards are untouched.
  sql += `update public.lesson_sessions s set stage='practice',updated_at=now() from public.lesson_plans old where old.module_id=s.module_id and s.module_id=${literal(p.module_id)} and s.stage='dynamic' and old.question_ids is distinct from ${array(p.question_ids)}::uuid[];\n`;
  sql += `update public.lesson_plans set level=${p.level},question_ids=${array(p.question_ids)}::uuid[],dynamic=${literal(JSON.stringify(p.dynamic))}::jsonb,resource_ids=${array(p.resource_ids)}::text[],pedagogy=${literal(JSON.stringify(c.pedagogy[p.module_id]))}::jsonb where module_id=${literal(p.module_id)};\n`;
}
await writeFile("supabase/pending-curriculum-delta.sql", sql + "commit;\n");
console.log("15 stable lessons; 60 new questions; original answers and historical records untouched.");
