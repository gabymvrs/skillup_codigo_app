import assert from "node:assert/strict";
export async function testLearning({
  db,
  id,
  test,
  actor,
  admin,
  rejects,
  scalar,
}) {
  await test("New learning tables deny manual points, dates, enrollment and forged timezone", async () => {
    await actor(1, "aal2");
    for (const sql of [
      `insert into public.reward_events(user_id,source,xp,label) values('${id(1)}','fake',9999,'Fraude')`,
      `update public.reward_events set xp=9999`,
      `insert into public.study_days(user_id,day) values('${id(1)}','2030-01-01')`,
      `update public.learning_settings set timezone='Pacific/Kiritimati'`,
      `insert into public.track_enrollments(user_id,track_id) values('${id(5)}','${id(2000)}')`,
      `select private.award_learning('${id(1)}','fake',9999,'Fraude')`,
    ])
      await rejects(sql);
  });
  await test("Server stores timezone once and awards one first-day bonus across repeated and different exercises", async () => {
    await actor(5);
    await db.exec(
      "select public.configure_learning_timezone('Pacific/Kiritimati')",
    );
    await db.exec(
      "select public.configure_learning_timezone('America/Sao_Paulo')",
    );
    assert.equal(
      await scalar("select timezone from public.learning_settings"),
      "Pacific/Kiritimati",
    );
    await rejects(
      "select public.configure_learning_timezone('invalid/timezone')",
    );
    await db.exec(
      `select public.submit_exercise('${id(6000)}','1');select public.submit_exercise('${id(6000)}','1');select public.submit_exercise('${id(6001)}','[true,false]');`,
    );
    assert.equal(await scalar("select count(*) from public.study_days"), 1);
    assert.equal(await scalar("select sum(xp) from public.reward_events"), 90);
    assert.equal(
      await scalar(
        "select count(*) from public.study_days where day=(now() at time zone 'Pacific/Kiritimati')::date",
      ),
      1,
    );
  });
  await test("Server grades all six formats and refuses legacy bypass, nulls and wrong answers", async () => {
    await actor(5);
    for (const [n, response] of [
      [6000, 1],
      [6001, [true, false]],
      [6002, " substantivo "],
      [6003, [0, 1, 2]],
      [6004, [0, 1, 2]],
      [
        6005,
        {
          text: "Uma apresentação de um projeto escolar com uma ideia principal clara e um exemplo concreto. Revisei a ortografia e a pontuação antes de compartilhar o texto com meus colegas.",
          checks: [true, true, true],
        },
      ],
    ]) {
      const value = (
        await db.query("select public.submit_exercise($1,$2) result", [
          id(n),
          JSON.stringify(response),
        ])
      ).rows[0].result;
      assert.equal(value.correct, true);
      const again = (
        await db.query("select public.submit_exercise($1,$2) result", [
          id(n),
          JSON.stringify(response),
        ])
      ).rows[0].result;
      assert.equal(again.xp, 0);
    }
    assert.equal(
      (
        await scalar(
          `select public.submit_exercise('${id(6002)}','"incorreto"')`,
        )
      ).correct,
      false,
    );
    await rejects(`select public.submit_exercise('${id(6001)}',null)`);
    await rejects(`select public.submit_answer('${id(6001)}',0)`);
    await rejects("select expected from private.question_answers");
  });
  await test("Milestone bonus is unique in each consecutive sequence; a gap resets the sequence", async () => {
    await admin();
    // Fixture dates inserted by the database owner, never exposed as client RPC parameters.
    await db.exec(`delete from public.study_days where user_id='${id(5)}';delete from public.reward_events where user_id='${id(5)}' and source like 'streak:%';
   insert into public.study_days(user_id,day) select '${id(5)}',(now() at time zone 'Pacific/Kiritimati')::date-n from generate_series(1,2)n;`);
    await actor(5);
    await db.exec(
      `select public.submit_exercise('${id(6010)}','1');select public.submit_exercise('${id(6011)}','[true,false]');`,
    );
    assert.equal(
      await scalar(
        "select sum(xp) from public.reward_events where source like 'streak:%'",
      ),
      30,
    );
    await admin();
    await db.exec(
      `delete from public.study_days where user_id='${id(5)}' and day>=(now() at time zone 'Pacific/Kiritimati')::date-1;`,
    );
    await actor(5);
    await db.exec(
      `select public.submit_exercise('${id(6012)}','"suprimentos"')`,
    );
    assert.equal(
      await scalar(
        "select sum(xp) from public.reward_events where source like 'streak:%'",
      ),
      40,
    );
  });
  await test("Parallel tracks require their own exercise and never complete a different track", async () => {
    await actor(5);
    await db.exec(
      `select public.start_track('${id(2000)}');select public.start_track('${id(2001)}');select public.start_track('${id(2000)}');`,
    );
    assert.equal(
      await scalar("select count(*) from public.track_enrollments"),
      2,
    );
    await rejects(`select public.complete_module('${id(3000)}')`);
    await db.exec(
      `select public.submit_exercise('${id(8000)}','0');select public.complete_module('${id(3000)}');select public.complete_module('${id(3000)}');`,
    );
    assert.equal(await scalar("select count(*) from public.progress"), 1);
    assert.equal(
      await scalar(
        `select count(*) from public.progress where module_id='${id(3010)}'`,
      ),
      0,
    );
    assert.equal(
      await scalar(
        `select count(*) from public.reward_events where source='module:${id(3000)}'`,
      ),
      1,
    );
    await rejects(`select public.complete_module('${id(3002)}')`);
  });
  await test("Material read history uses server timestamps and persists completion", async () => {
    await actor(5);
    await db.exec(
      `select public.record_material_read('${id(150)}',true);select public.record_material_read('${id(150)}',false);`,
    );
    assert.equal(await scalar("select count(*) from public.material_reads"), 1);
    assert.equal(
      await scalar(
        "select completed_at is not null from public.material_reads",
      ),
      true,
    );
    await rejects(
      `insert into public.material_reads(user_id,material_id) values('${id(1)}','${id(150)}')`,
    );
    await actor(1, "aal2");
    assert.equal(await scalar("select count(*) from public.material_reads"), 0);
  });
  await test("Avatar upload, profile reference and reads enforce ownership and profile visibility", async () => {
    await actor(5);
    await db.exec(
      `insert into storage.objects(bucket_id,name) values('avatars','${id(5)}/photo.png');update public.profiles set avatar_path='${id(5)}/photo.png' where id='${id(5)}';`,
    );
    await rejects(
      `update public.profiles set avatar_path='${id(1)}/photo.png' where id='${id(5)}'`,
    );
    await actor(1, "aal2");
    await rejects(
      `insert into storage.objects(bucket_id,name) values('avatars','${id(5)}/other.png')`,
    );
    assert.equal(
      await scalar(
        "select count(*) from storage.objects where bucket_id='avatars'",
      ),
      0,
    );
    await actor(5);
    await db.exec(
      `update public.profiles set public_profile=true where id='${id(5)}'`,
    );
    await actor(1, "aal2");
    assert.equal(
      await scalar(
        "select count(*) from storage.objects where bucket_id='avatars'",
      ),
      1,
    );
    assert.equal(
      (
        await db.query(
          "delete from storage.objects where bucket_id='avatars' returning id",
        )
      ).rows.length,
      0,
    );
  });
  await test("Weekly ranking includes only opt-in students and recorded current-week XP", async () => {
    await actor(5);
    const rows = (await db.query("select * from public.weekly_leaderboard()"))
      .rows;
    assert.ok(rows.some((r) => r.user_id === id(5)));
    assert.ok(rows.every((r) => r.user_id !== id(1) && r.user_id !== id(2)));
    const own = rows.find((r) => r.user_id === id(5));
    assert.equal(
      Number(own.xp),
      await scalar(
        "select sum(xp) from public.reward_events where created_at>=date_trunc('week',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'",
      ),
    );
    await actor(null);
    await rejects("select * from public.weekly_leaderboard()");
    await rejects(`select public.submit_exercise('${id(6000)}','1')`);
  });
  await admin();
}
