import assert from "node:assert/strict";
export async function testPortfolio({
  db,
  id,
  test,
  actor,
  admin,
  rejects,
  scalar,
}) {
  await admin();
  for (const n of [30, 31, 32]) {
    await db.exec(
      `insert into auth.users(id,raw_user_meta_data) values('${id(n)}','{"full_name":"Portfolio Test"}');insert into auth.sessions(id,user_id) values('${id(n)}','${id(n)}');`,
    );
  }
  await db.exec(
    `update public.user_roles set role='recrutador' where user_id='${id(32)}';`,
  );
  await test("Portfolio edits and skills validation enforce identity and unique skills", async () => {
    await actor(30);
    await db.exec(
      `insert into public.student_portfolios(id,study_area,education,public_portfolio) values('${id(30)}','Design','Curso técnico',true);update public.profiles set headline='UI/UX Designer em formação',skills=array['Figma','Acessibilidade'] where id='${id(30)}';`,
    );
    await rejects(
      `update public.profiles set skills=array['Figma','figma'] where id='${id(30)}'`,
    );
    await actor(31);
    await db.exec(
      `update public.student_portfolios set education='forged' where id='${id(30)}'`,
    );
    await rejects(
      `insert into public.student_portfolios(id) values('${id(30)}')`,
    );
    await admin();
    assert.equal(
      await scalar(
        `select education from public.student_portfolios where id='${id(30)}'`,
      ),
      "Curso técnico",
    );
  });
  await test("Public project projections exclude private and community projects and account fields", async () => {
    await actor(30);
    for (const [n, v] of [
      [9100, "public"],
      [9101, "community"],
      [9102, "private"],
    ])
      await db.exec(
        `insert into public.projects(id,owner_id,title,description,category,visibility) values('${id(n)}','${id(30)}','Project ${v}','A project description with enough characters.','Design','${v}');`,
      );
    await actor(null);
    const p = await scalar(`select public.public_project('${id(9100)}')`);
    assert.equal(p.title, "Project public");
    assert.equal(p.email, undefined);
    assert.equal(p.preferences, undefined);
    assert.equal(
      await scalar(`select public.public_project('${id(9101)}')`),
      null,
    );
    assert.equal(
      await scalar(`select public.public_project('${id(9102)}')`),
      null,
    );
    await actor(31);
    assert.equal(
      await scalar(
        `select count(*) from public.projects where id='${id(9102)}'`,
      ),
      0,
    );
  });
  await test("Shared projects, comments and reactions become inaccessible after privacy changes", async () => {
    await actor(30);
    await db.exec(
      `insert into public.posts(id,user_id,author_name,kind,category,title,body,project_id) values('${id(9110)}','${id(30)}','Student','feed','Design','Shared project','A shared community project.','${id(9100)}');insert into public.comments(id,post_id,user_id,author_name,body) values('${id(9111)}','${id(9110)}','${id(30)}','Student','A sample comment.');`,
    );
    await actor(31);
    assert.equal(
      await scalar(
        `select count(*) from public.comments where id='${id(9111)}'`,
      ),
      1,
    );
    await actor(30);
    await db.exec(
      `update public.projects set visibility='private' where id='${id(9100)}'`,
    );
    await actor(31);
    assert.equal(
      await scalar(`select count(*) from public.posts where id='${id(9110)}'`),
      0,
    );
    assert.equal(
      await scalar(
        `select count(*) from public.comments where id='${id(9111)}'`,
      ),
      0,
    );
    await rejects(
      `insert into public.comments(post_id,user_id,author_name,body) values('${id(9110)}','${id(31)}','Student','Hidden target')`,
    );
    await rejects(`select public.report_comment('${id(9111)}','Spam','')`);
    await actor(30);
    await db.exec(
      `update public.projects set visibility='public' where id='${id(9100)}'`,
    );
  });
  await test("Reports are persisted privately; duplicates, spoofing and excess submissions are rejected", async () => {
    await actor(31);
    await db.exec(
      `select public.report_comment('${id(9111)}','Spam','Example report')`,
    );
    assert.equal(
      await scalar("select count(*) from public.comment_reports"),
      1,
    );
    await rejects(
      `select public.report_comment('${id(9111)}','Outro','Again')`,
    );
    await rejects(
      `insert into public.comment_reports(comment_id,reporter_id,reason) values('${id(9111)}','${id(30)}','Spam')`,
    );
    await actor(30);
    assert.equal(
      await scalar("select count(*) from public.comment_reports"),
      0,
    );
    assert.equal(
      await scalar(
        `select count(*) from public.comments where id='${id(9111)}'`,
      ),
      1,
    );
    for (let n = 9120; n < 9125; n++)
      await db.exec(
        `insert into public.comments(id,post_id,user_id,author_name,body) values('${id(n)}','${id(9110)}','${id(30)}','Student','Comment for rate limit')`,
      );
    await actor(31);
    for (let n = 9120; n < 9124; n++)
      await db.exec(`select public.report_comment('${id(n)}','Spam','')`);
    await rejects(`select public.report_comment('${id(9124)}','Spam','')`);
  });
  await test("Highlights support CRUD, privacy and a server-enforced three-pin limit", async () => {
    await actor(30);
    for (const [n, v] of [
      [9200, "private"],
      [9201, "community"],
      [9202, "public"],
    ])
      await db.exec(
        `insert into public.profile_highlights(id,user_id,kind,title,organization,description,started_on,visibility,pinned) values('${id(n)}','${id(30)}','Certificado','Course highlight','Institute','Sample description','2026-01-01','${v}',true)`,
      );
    await rejects(
      `insert into public.profile_highlights(user_id,kind,title,started_on,pinned) values('${id(30)}','Evento','Fourth pinned','2026-01-01',true)`,
    );
    await actor(31);
    assert.equal(
      await scalar(
        `select count(*) from public.profile_highlights where user_id='${id(30)}'`,
      ),
      2,
    );
    await db.exec(
      `update public.profile_highlights set title='Forged title' where id='${id(9202)}'`,
    );
    await actor(null);
    assert.equal(
      await scalar(`select public.public_highlight('${id(9200)}')`),
      null,
    );
    const p = await scalar(
      `select public.public_student_portfolio('${id(30)}')`,
    );
    assert.equal(p.highlights.length, 1);
    assert.equal(p.highlights[0].title, "Course highlight");
    assert.equal(p.student_resumes, undefined);
    assert.equal(p.preferences, undefined);
    await actor(30);
    await db.exec(
      `update public.profile_highlights set title='Updated title',pinned=false where id='${id(9202)}';delete from public.profile_highlights where id='${id(9201)}'`,
    );
    assert.equal(
      await scalar(
        `select title from public.profile_highlights where id='${id(9202)}'`,
      ),
      "Updated title",
    );
  });
  await test("Badges derive from server records and cannot be manually awarded or featured while locked", async () => {
    await actor(30);
    await rejects(
      `insert into public.student_achievements(user_id,achievement_id) values('${id(30)}','first_lesson')`,
    );
    await rejects(
      `update public.student_portfolios set featured_badges=array['first_lesson'] where id='${id(30)}'`,
    );
    await admin();
    await db.exec(
      `insert into public.progress(user_id,module_id) select '${id(30)}',id from public.modules order by id limit 1`,
    );
    await actor(30);
    await db.exec("select public.refresh_student_achievements()");
    assert.equal(
      await scalar(
        `select count(*) from public.student_achievements where user_id='${id(30)}' and achievement_id='first_lesson'`,
      ),
      1,
    );
    await db.exec(
      `update public.student_portfolios set featured_badges=array['first_lesson','creator'] where id='${id(30)}'`,
    );
    await rejects(
      `update public.student_achievements set earned_at='2000-01-01'`,
    );
  });
  await test("Resume files require confirmed owner upload and remain private until attached to a specific application", async () => {
    await actor(30);
    await rejects(
      `insert into public.student_resumes(user_id,file_path,file_name,size_bytes) values('${id(30)}','${id(30)}/missing.pdf','missing.pdf',30)`,
    );
    await db.exec(
      `insert into storage.objects(bucket_id,name) values('student-resumes','${id(30)}/first.pdf');insert into public.student_resumes(id,user_id,file_path,file_name,size_bytes) values('${id(9300)}','${id(30)}','${id(30)}/first.pdf','first.pdf',30)`,
    );
    await actor(31);
    assert.equal(
      await scalar(
        `select count(*) from public.student_resumes where id='${id(9300)}'`,
      ),
      0,
    );
    assert.equal(
      await scalar(
        `select count(*) from storage.objects where name='${id(30)}/first.pdf'`,
      ),
      0,
    );
    await rejects(
      `insert into storage.objects(bucket_id,name) values('student-resumes','${id(30)}/forged.pdf')`,
    );
    await actor(null);
    assert.equal(
      await scalar(
        `select count(*) from storage.objects where name='${id(30)}/first.pdf'`,
      ),
      0,
    );
    await actor(32);
    await db.exec(
      `insert into public.jobs(id,owner_id,title,company,location,mode,description) values('${id(9310)}','${id(32)}','Test role','Company','Recife','Remoto','A real length description for the test opportunity.')`,
    );
    await actor(31);
    await rejects(
      `insert into public.applications(job_id,student_id,cover_letter,resume_id) values('${id(9310)}','${id(31)}','This is a cover letter for the opportunity.','${id(9300)}')`,
    );
    await actor(30);
    await db.exec(
      `insert into public.applications(id,job_id,student_id,cover_letter,resume_id) values('${id(9320)}','${id(9310)}','${id(30)}','This is a cover letter for the opportunity.','${id(9300)}')`,
    );
    await actor(32);
    assert.equal(
      await scalar(
        `select count(*) from storage.objects where name='${id(30)}/first.pdf'`,
      ),
      1,
    );
    await actor(30);
    await db.exec(
      `select public.set_application_status('${id(9320)}','withdrawn')`,
    );
    await actor(32);
    assert.equal(
      await scalar(
        `select count(*) from storage.objects where name='${id(30)}/first.pdf'`,
      ),
      0,
    );
  });
  await test("Resume replacement and removal retain ownership and detach deleted documents", async () => {
    await actor(30);
    await db.exec(
      `insert into storage.objects(bucket_id,name) values('student-resumes','${id(30)}/second.pdf');update public.student_resumes set file_path='${id(30)}/second.pdf',file_name='second.pdf' where id='${id(9300)}';delete from storage.objects where name='${id(30)}/first.pdf'`,
    );
    assert.equal(
      await scalar(
        `select file_name from public.student_resumes where id='${id(9300)}'`,
      ),
      "second.pdf",
    );
    await db.exec(
      `delete from storage.objects where name='${id(30)}/second.pdf';delete from public.student_resumes where id='${id(9300)}'`,
    );
    assert.equal(
      await scalar(
        `select resume_id from public.applications where id='${id(9320)}'`,
      ),
      null,
    );
  });
  await test("Portfolio file visibility follows the linked record and anonymous reads exclude private files", async () => {
    await actor(30);
    await db.exec(
      `insert into storage.objects(bucket_id,name) values('portfolio-files','${id(30)}/certificate.pdf');update public.profile_highlights set file_path='${id(30)}/certificate.pdf' where id='${id(9200)}'`,
    );
    await actor(null);
    assert.equal(
      await scalar(
        `select count(*) from storage.objects where name='${id(30)}/certificate.pdf'`,
      ),
      0,
    );
    await actor(30);
    await db.exec(
      `update public.profile_highlights set visibility='public' where id='${id(9200)}'`,
    );
    await actor(null);
    assert.equal(
      await scalar(
        `select count(*) from storage.objects where name='${id(30)}/certificate.pdf'`,
      ),
      1,
    );
  });
  await test("Non-students cannot modify student portfolio records or award badges", async () => {
    await actor(32);
    await rejects(
      `insert into public.student_portfolios(id) values('${id(32)}')`,
    );
    await rejects("select public.refresh_student_achievements()");
    await rejects(`select public.report_comment('${id(9111)}','Spam','')`);
  });
  await admin();
}
