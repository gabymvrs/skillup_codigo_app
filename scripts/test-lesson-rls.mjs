import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
export async function testLesson({
  db,
  id,
  test,
  actor,
  admin,
  rejects,
  scalar,
}) {
  await admin();
  await db.exec(
    `insert into auth.users(id,raw_user_meta_data) values('${id(40)}','{"full_name":"Lesson Test"}');insert into auth.sessions(id,user_id) values('${id(40)}','${id(40)}');`,
  );
  await db.exec(await readFile("supabase/lesson-seed.sql", "utf8"));
  const module = id(4000),
    question = id(12000);
  const call = async (action, payload = null) =>
    (
      await db.query("select public.lesson_action($1,$2,$3) result", [
        module,
        action,
        JSON.stringify(payload),
      ])
    ).rows[0].result;
  await test("Lesson server refuses stage skipping and direct writes even after an external correct answer", async () => {
    await actor(40);
    await rejects(
      `insert into public.lesson_sessions(user_id,module_id,stage) values('${id(40)}','${module}','completed')`,
    );
    await rejects(`select public.complete_module('${module}')`);
    await call("get");
    await assert.rejects(() =>
      call("finish", { text: "x".repeat(200), checks: [true, true] }),
    );
    await assert.rejects(() =>
      call("answer", { question_id: question, response: 0 }),
    );
    await call("theory");
    await assert.rejects(() => call("practice"));
    await assert.rejects(() =>
      call("answer", { question_id: id(12001), response: "in" }),
    );
    await rejects(`select public.complete_module('${module}')`);
  });
  await test("Lesson results preserve first-answer accuracy and defer rewards until all three parts", async () => {
    await actor(40);
    const before = Number(
      await scalar(
        `select coalesce(sum(xp),0) from public.reward_events where user_id='${id(40)}'`,
      ),
    );
    const wrong = await call("answer", { question_id: question, response: 1 });
    assert.equal(wrong.session.results[question].correct, false);
    const correct = await call("answer", {
      question_id: question,
      response: 0,
    });
    assert.deepEqual(correct.session.results[question], {
      correct: true,
      firstCorrect: false,
      tries: 2,
      explanation: correct.session.results[question].explanation,
    });
    assert.equal(
      Number(
        await scalar(
          `select coalesce(sum(xp),0) from public.reward_events where user_id='${id(40)}'`,
        ),
      ),
      before,
    );
    assert.equal(
      await scalar(
        `select xp from public.attempts where user_id='${id(40)}' and lesson_module_id='${module}' order by created_at desc limit 1`,
      ),
      0,
    );
    await call("practice");
    await assert.rejects(() =>
      call("finish", { text: "short", checks: [true, true] }),
    );
    const done = await call("finish", {
      text: "A condição é testada antes de executar o bloco. Vou verificar os limites da regra com um valor igual, um menor e um maior que o limite.",
      checks: [true, true],
    });
    assert.equal(done.session.stage, "completed");
    assert.equal(done.session.xp, 100);
    const after = Number(
      await scalar(
        `select coalesce(sum(xp),0) from public.reward_events where user_id='${id(40)}'`,
      ),
    );
    await call("finish");
    await db.exec(`select public.complete_module('${module}')`);
    assert.equal(
      Number(
        await scalar(
          `select coalesce(sum(xp),0) from public.reward_events where user_id='${id(40)}'`,
        ),
      ),
      after,
    );
  });
  await test("Lesson sessions and saved resources enforce ownership; client code verdicts remain forbidden", async () => {
    await actor(5);
    assert.equal(
      await scalar(
        `select count(*) from public.lesson_sessions where user_id='${id(40)}'`,
      ),
      0,
    );
    await rejects(
      `select public.record_lesson_code_result('${id(5)}','${id(5)}','aal1','${id(4002)}','${id(12002)}','print(7)',true,'ok')`,
    );
    await db.exec(
      `insert into public.saved_learning_resources(resource_id) values('python-control')`,
    );
    await rejects(
      `insert into public.saved_learning_resources(user_id,resource_id) values('${id(40)}','js-control')`,
    );
    await actor(40);
    assert.equal(
      await scalar("select count(*) from public.saved_learning_resources"),
      0,
    );
    await actor(null);
    await rejects("select * from public.lesson_sessions");
    await rejects(`select public.lesson_action('${module}','get')`);
  });
  await test("Trusted lesson code grading respects the lesson stage and does not mint early XP", async () => {
    await actor(5);
    await db.exec(
      `select public.lesson_action('${id(4002)}','get');select public.lesson_action('${id(4002)}','theory');`,
    );
    await admin();
    await db.exec("set role service_role");
    const result = (
      await db.query(
        "select public.record_lesson_code_result($1,$2,$3,$4,$5,$6,$7,$8) result",
        [id(5), id(5), "aal1", id(4002), id(12002), "print(7)", true, "ok"],
      )
    ).rows[0].result;
    assert.equal(result.session.stage, "practice");
    assert.equal(result.session.results[id(12002)].correct, true);
    await actor(5);
    assert.equal(
      await scalar(
        `select xp from public.attempts where lesson_module_id='${id(4002)}' and user_id='${id(5)}' limit 1`,
      ),
      0,
    );
  });
  await test("All 56 modules have plans; legacy seed is idempotent and preserves recorded progress", async () => {
    await admin();
    assert.equal(
      await scalar(
        "select count(*) from public.modules m left join public.lesson_plans p on p.module_id=m.id where p.module_id is null",
      ),
      0,
    );
    assert.equal(await scalar("select count(*) from public.lesson_plans"), 56);
    assert.equal(
      await scalar(
        "select count(*) from public.lesson_plans where module_id in (select id from public.modules where track_id in ('" +
          id(200) +
          "','" +
          id(201) +
          "')) and cardinality(question_ids)=5",
      ),
      10,
    );
    const progress = await scalar("select count(*) from public.progress");
    const questions = await scalar("select count(*) from public.questions");
    await db.exec(await readFile("supabase/lesson-seed.sql", "utf8"));
    assert.equal(
      await scalar("select count(*) from public.progress"),
      progress,
    );
    assert.equal(
      await scalar("select count(*) from public.questions"),
      questions,
    );
  });
  await test("All ten legacy lessons grade five formats, block partial practice and reward only after the dynamic", async () => {
    await admin();
    await db.exec(
      `insert into auth.users(id,raw_user_meta_data) values('${id(41)}','{"full_name":"Complete Catalogue Test"}');insert into auth.sessions(id,user_id) values('${id(41)}','${id(41)}');`,
    );
    const upgrades = JSON.parse(
      await readFile("src/data/foundation-lessons.json", "utf8"),
    );
    const plans = JSON.parse(
      await readFile("src/data/lesson-plans.json", "utf8"),
    );
    await actor(41);
    for (const module of upgrades.modules) {
      const plan = plans.find((p) => p.module_id === module.id);
      const action = async (name, payload = null) =>
        (
          await db.query("select public.lesson_action($1,$2,$3) result", [
            module.id,
            name,
            JSON.stringify(payload),
          ])
        ).rows[0].result;
      await action("get");
      await rejects(`select public.complete_module('${module.id}')`);
      await action("theory");
      const xpBefore = await scalar(
        "select coalesce(sum(xp),0) from public.reward_events",
      );
      for (const qid of plan.question_ids) {
        await assert.rejects(() => action("practice"));
        const result = await action("answer", {
          question_id: qid,
          response: upgrades.answers[qid],
        });
        assert.equal(result.session.results[qid].correct, true);
      }
      assert.equal(
        await scalar("select coalesce(sum(xp),0) from public.reward_events"),
        xpBefore,
      );
      await action("practice");
      await assert.rejects(() =>
        action("finish", { text: "x".repeat(400), checks: [] }),
      );
      await action("finish", {
        text: "Exemplo com entradas, passos, resultados e testes: ".repeat(9),
        checks: plan.dynamic.criteria.map(() => true),
      });
      const xpAfter = await scalar(
        "select coalesce(sum(xp),0) from public.reward_events",
      );
      await action("finish");
      assert.equal(
        await scalar("select coalesce(sum(xp),0) from public.reward_events"),
        xpAfter,
      );
    }
    assert.equal(await scalar("select count(*) from public.progress"), 10);
    assert.equal(
      await scalar(
        "select count(*) from public.attempts where lesson_module_id is not null",
      ),
      50,
    );
  });
  await admin();
}
