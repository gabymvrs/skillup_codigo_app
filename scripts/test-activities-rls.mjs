import assert from "node:assert/strict";
export async function testActivities({
  db,
  id,
  test,
  actor,
  admin,
  rejects,
  scalar,
}) {
  await test("Activity type dispatch grades numeric answers with comma decimals and preserves unique XP", async () => {
    await actor(5);
    const response = (
      await db.query("select public.submit_exercise($1,$2) result", [
        id(12017),
        '"2,0"',
      ])
    ).rows[0].result;
    assert.equal(response.correct, true);
    assert.equal(response.xp, 60);
    const repeat = (
      await db.query("select public.submit_exercise($1,$2) result", [
        id(12017),
        '"2.00"',
      ])
    ).rows[0].result;
    assert.equal(repeat.xp, 0);
    await rejects(`select public.submit_exercise('${id(12017)}','"NaN"')`);
    const wrong = (
      await db.query("select public.submit_exercise($1,$2) result", [
        id(12011),
        '"31"',
      ])
    ).rows[0].result;
    assert.equal(wrong.correct, false);
  });
  await test("Code activities cannot be completed through client verdicts or legacy answer endpoints", async () => {
    await actor(5);
    await rejects(`select public.submit_exercise('${id(12002)}','"print(7)"')`);
    await rejects(`select public.submit_answer('${id(12002)}',0)`);
    await rejects(
      `select private.submit_exercise_v7('${id(12002)}','"print(7)"')`,
    );
    await rejects(`select public.code_grading_spec('${id(12002)}')`);
    await rejects(
      `select public.record_code_result('${id(5)}','${id(5)}','aal1','${id(12002)}','print(7)',true,'ok')`,
    );
    await rejects(`select public.complete_module('${id(4002)}')`);
    assert.equal(
      await scalar(
        `select public.code_activity_context('${id(12002)}')->>'language'`,
      ),
      "python",
    );
    await rejects(`select public.code_activity_context('${id(12002)}')`);
  });
  await test("Trusted code grading uses the same reward, streak and module prerequisites with duplicate protection", async () => {
    await actor(5);
    await db.exec(
      `select public.submit_exercise('${id(12000)}','0');select public.complete_module('${id(4000)}');select public.submit_exercise('${id(12001)}','"in"');select public.complete_module('${id(4001)}');`,
    );
    await rejects(`select public.complete_module('${id(4002)}')`);
    await admin();
    await db.exec("set role service_role");
    const args = [
      id(5),
      id(5),
      "aal1",
      id(12002),
      "a=int(input())\nb=int(input())\nprint(a+b)",
      true,
      "ok",
    ];
    const call =
      "select public.record_code_result($1,$2,$3,$4,$5,$6,$7) result";
    assert.equal((await db.query(call, args)).rows[0].result.xp, 100);
    assert.equal((await db.query(call, args)).rows[0].result.xp, 0);
    await actor(5);
    await db.exec(`select public.complete_module('${id(4002)}')`);
    assert.equal(
      await scalar(
        `select count(*) from public.progress where module_id='${id(4002)}'`,
      ),
      1,
    );
    assert.equal(
      await scalar(
        `select count(*) from public.reward_events where source='question:${id(12002)}'`,
      ),
      1,
    );
    await admin();
    await db.exec("set role service_role");
    await rejects(
      `select public.record_code_result('${id(5)}','${id(2)}','aal1','${id(12002)}','print(7)',true,'ok')`,
    );
    await admin();
  });
}
