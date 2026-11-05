import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

// A local migration fixture: verifies this delta's SQL, not production RLS.
const read = async (file) => JSON.parse(await readFile(file, "utf8"));
const curriculum = await read("src/data/beginner-curriculum.json");
const enrichment = await read("src/data/enrichment.json");
const activities = await read("src/data/track-activities.json");
const originalPlans = await read("src/data/lesson-plans.json");
const delta = await readFile("supabase/pending-curriculum-delta.sql", "utf8");
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ids = [3040,3041,3042,4011,4012,3060,3061,3062,4015,4016,3070,3071,3072,4017,4018].map(uid);
const originalAnswers = { ...enrichment.answers, ...activities.answers };
const db = new PGlite();
try {
  await db.exec(`
    create schema private;
    create table public.modules(id uuid primary key,title text,body text,position int,prerequisite_id uuid,question_id uuid,xp int);
    create table public.questions(id uuid primary key,title text,prompt text,options jsonb,explanation text,kind text,activity_type text,category text,subject_id uuid,payload jsonb,xp int);
    create table private.question_answers(question_id uuid primary key,correct_index int,expected jsonb);
    create table public.lesson_plans(module_id uuid primary key,level int,question_ids uuid[],dynamic jsonb,resource_ids text[],pedagogy jsonb);
    create table public.lesson_sessions(user_id uuid,module_id uuid,stage text,updated_at timestamptz,results jsonb,dynamic_response jsonb,xp int);
    create table public.attempts(id int primary key,question_id uuid,xp int);
    create table public.progress(id int primary key,module_id uuid);
    create table public.reward_events(id int primary key,xp int);
  `);
  for (const m of [...enrichment.modules, ...activities.modules]) {
    if (!ids.includes(m.id)) continue;
    await db.query("insert into public.modules values($1,$2,$3,$4,$5,$6,$7)", [m.id,m.title,m.body,m.position,m.prerequisite_id,m.question_id,m.xp]);
  }
  const plans = originalPlans.filter((p) => ids.includes(p.module_id));
  const originalIds = new Set(plans.flatMap((p) => p.question_ids));
  for (const q of [...enrichment.questions, ...activities.questions]) {
    if (!originalIds.has(q.id)) continue;
    await db.query("insert into public.questions values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [q.id,q.title,q.prompt,JSON.stringify(q.options),q.explanation,q.kind,q.activity_type ?? null,q.category,q.subject_id,JSON.stringify(q.payload),q.xp]);
    const answer = originalAnswers[q.id];
    await db.query("insert into private.question_answers values($1,$2,$3)", [q.id, typeof answer === "number" ? answer : null, JSON.stringify(answer) ?? null]);
  }
  for (const p of plans)
    await db.query("insert into public.lesson_plans values($1,$2,$3,$4,$5,null)", [p.module_id,p.level,p.question_ids,JSON.stringify(p.dynamic),p.resource_ids]);
  await db.query("insert into public.lesson_sessions values($1,$2,'dynamic','2026-11-01', $3,$4,0),($5,$2,'completed','2026-11-01',$3,$4,100)", [uid(99),uid(3040),JSON.stringify({ [uid(8012)]: { correct:true,firstCorrect:false,tries:2 } }),JSON.stringify({text:"Rascunho preservado",checks:[true]}),uid(98)]);
  await db.query("insert into public.attempts values(1,$1,40);", [uid(8012)]);
  await db.query("insert into public.progress values(1,$1);", [uid(3040)]);
  await db.exec("insert into public.reward_events values(1,100);");
  const rows = async (table, order = "id") => (await db.query(`select * from ${table} order by ${order}`)).rows;
  const answersBefore = await rows("private.question_answers", "question_id");
  const modulesBefore = await rows("public.modules");
  const sessionsBefore = await rows("public.lesson_sessions", "user_id");
  const historyBefore = await Promise.all(["attempts","progress","reward_events"].map((t) => rows(`public.${t}`)));
  await db.exec(delta);
  for (const m of await rows("public.modules")) {
    const old = modulesBefore.find((old) => old.id === m.id);
    assert.equal(m.position, old.position);
    assert.equal(m.prerequisite_id, old.prerequisite_id);
    assert.equal(m.xp, old.xp);
    assert.equal(m.title, curriculum.modules.find((x) => x.id === m.id).title);
  }
  const allAnswers = await rows("private.question_answers", "question_id");
  assert.deepEqual(allAnswers.filter((a) => originalIds.has(a.question_id)), answersBefore);
  assert.equal((await rows("public.questions")).length, originalIds.size + 60);
  const distribution = [0,0,0];
  for (const q of curriculum.questions.filter((q) => Number(q.id.slice(-5)) >= 21000 && Number(q.id.slice(-5)) < 21100)) {
    const answer = allAnswers.find((a) => a.question_id === q.id);
    assert.equal(answer.expected, curriculum.answers[q.id]);
    distribution[answer.correct_index]++;
  }
  assert.deepEqual(distribution, [20,20,20]);
  const sessions = await rows("public.lesson_sessions", "user_id");
  assert.deepEqual(sessions.find((s) => s.stage === "completed"), sessionsBefore.find((s) => s.stage === "completed"));
  const active = sessions.find((s) => s.user_id === uid(99));
  const previous = sessionsBefore.find((s) => s.user_id === uid(99));
  assert.equal(active.stage, "practice");
  assert.deepEqual(active.results, previous.results);
  assert.deepEqual(active.dynamic_response, previous.dynamic_response);
  assert.equal(active.xp, previous.xp);
  assert.deepEqual(await Promise.all(["attempts","progress","reward_events"].map((t) => rows(`public.${t}`))), historyBefore);
  const snapshot = await Promise.all([rows("public.questions"),rows("private.question_answers","question_id"),rows("public.lesson_sessions","user_id")]);
  await db.exec(delta);
  assert.deepEqual(await Promise.all([rows("public.questions"),rows("private.question_answers","question_id"),rows("public.lesson_sessions","user_id")]), snapshot);
  // Each precondition must reject the transaction before any curriculum mutation.
  for (const [label, change, restore] of [
    ["position", `update public.modules set position=99 where id='${uid(3040)}'`, `update public.modules set position=0 where id='${uid(3040)}'`],
    ["prerequisite", `update public.modules set prerequisite_id='${uid(3040)}' where id='${uid(3040)}'`, `update public.modules set prerequisite_id=null where id='${uid(3040)}'`],
    ["missing original plan", `update public.lesson_plans set module_id='${uid(9999)}' where module_id='${uid(3040)}'`, `update public.lesson_plans set module_id='${uid(3040)}' where module_id='${uid(9999)}'`],
    ["missing original question", `update public.questions set id='${uid(9999)}' where id='${uid(8018)}'`, `update public.questions set id='${uid(8018)}' where id='${uid(9999)}'`],
  ]) {
    await db.exec(change);
    await assert.rejects(() => db.exec(delta), /Pending curriculum precondition failed/, label);
    await db.exec("rollback;");
    await db.exec(restore);
  }
  console.log("Pending delta: 15 stable modules, 60 answer keys, original answers/history/XP preserved, unfinished sessions reopened, repeat apply stable; 4 precondition failures verified.");
} finally {
  await db.close();
}
