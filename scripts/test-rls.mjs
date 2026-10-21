import { testLearning } from "./test-learning-rls.mjs";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const results = [];
await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema storage;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz default now(),is_anonymous boolean default false,banned_until timestamptz);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);
 create table auth.mfa_factors(id uuid primary key default gen_random_uuid(),user_id uuid,status text);
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null);
 alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;
 create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
`);
for (const file of (await readdir("supabase/migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  try {
    await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
    console.log("Applied", file);
  } catch (e) {
    console.error("MIGRATION FAILED", file, e.message);
    process.exitCode = 1;
    await db.close();
    throw e;
  }
}
await db.exec(await readFile("supabase/seed.sql", "utf8"));
for (let i = 1; i <= 7; i++)
  await db.query(
    "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
    [
      id(i),
      JSON.stringify({
        full_name: `Pessoa ${i}`,
        role: "instituicao",
        requested_role: i === 7 ? "instituicao" : "estudante",
      }),
    ],
  );
await db.exec(
  `insert into auth.sessions(id,user_id) select id,id from auth.users;`,
);
await db.exec(`insert into public.organizations(id,name) values('${id(8)}','Escola A'),('${id(9)}','Escola B');
 update public.user_roles set organization_id='${id(8)}' where user_id in ('${id(1)}','${id(2)}','${id(3)}','${id(4)}');
 update public.user_roles set role='docente' where user_id in ('${id(2)}','${id(6)}');
 update public.user_roles set role='recrutador' where user_id='${id(3)}';update public.user_roles set role='instituicao' where user_id='${id(4)}';
 update public.user_roles set organization_id='${id(9)}' where user_id in ('${id(5)}','${id(6)}');
 insert into public.classes(id,organization_id,teacher_id,title,subject) values('${id(500)}','${id(8)}','${id(2)}','Turma A','Programação'),('${id(501)}','${id(9)}','${id(6)}','Turma B','Programação');
 insert into public.enrollments(class_id,user_id) values('${id(500)}','${id(1)}'),('${id(501)}','${id(5)}');
 insert into public.assignments(id,class_id,teacher_id,title,instructions,due_at) values('${id(520)}','${id(500)}','${id(2)}','Atividade A','Descreva o algoritmo e os testes realizados.',now()+interval '7 days');
 insert into public.jobs(id,owner_id,title,company,location,mode,description,skills) values('${id(800)}','${id(3)}','Estágio','Empresa A','Recife','Remoto','Desenvolver interfaces e documentar componentes de software.',array['HTML']);
`);
async function actor(n, aal = "aal1") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify(n ? { sub: id(n), aal, session_id: id(n) } : {}),
  ]);
  await db.exec(`set role ${n ? "authenticated" : "anon"}`);
}
async function admin() {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims','{}',false)");
}
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: "pass" });
    console.log("PASS", name);
  } catch (e) {
    results.push({ name, status: "fail", error: e.message });
    console.error("FAIL", name, e.message);
  }
}
async function rejects(sql) {
  await assert.rejects(() => db.exec(sql));
}
async function scalar(sql) {
  return Object.values((await db.query(sql)).rows[0])[0];
}
await test("Signup ignores forged administrative metadata", async () => {
  await actor(7);
  assert.equal(
    await scalar(`select role from public.user_roles where user_id='${id(7)}'`),
    "estudante",
  );
  assert.equal(
    await scalar("select status from public.role_requests"),
    "pending",
  );
});
await test("No role self-promotion or approval from browser", async () => {
  await actor(7);
  await rejects(
    `update public.user_roles set role='instituicao' where user_id='${id(7)}'`,
  );
  await rejects("update public.role_requests set status='approved'");
});
await test("Student can update only their own editable profile", async () => {
  await actor(1);
  await db.exec(
    `update public.profiles set headline='Estudante ADS' where id='${id(1)}'`,
  );
  assert.equal(
    await scalar(`select headline from public.profiles where id='${id(1)}'`),
    "Estudante ADS",
  );
  assert.equal(
    (
      await db.query(
        `update public.profiles set full_name='Intruso' where id='${id(5)}' returning id`,
      )
    ).rows.length,
    0,
  );
});
await test("Student and institution cannot read other tenant classes", async () => {
  await actor(1);
  assert.equal(await scalar("select count(*) from public.classes"), 1);
  await actor(4);
  assert.equal(await scalar("select count(*) from public.classes"), 1);
});
await test("Only institution can enroll their affiliated students", async () => {
  await actor(2);
  await rejects(
    `insert into public.enrollments(class_id,user_id) values('${id(500)}','${id(5)}')`,
  );
  await actor(4);
  await rejects(
    `insert into public.enrollments(class_id,user_id) values('${id(500)}','${id(5)}')`,
  );
});
await test("Student cannot publish jobs or mint XP rows", async () => {
  await actor(1);
  await rejects(
    `insert into public.jobs(owner_id,title,company,location,mode,description) values('${id(1)}','Vaga falsa','Empresa','Recife','Remoto','Descrição longa para tentar criar uma vaga indevida.')`,
  );
  await rejects(
    `insert into public.progress(user_id,module_id) values('${id(1)}','${id(300)}')`,
  );
  await rejects(
    `insert into public.attempts(user_id,question_id,selected_index,correct,xp) values('${id(1)}','${id(400)}',1,true,999)`,
  );
});
await test("Prerequisite enforced; module completion idempotent", async () => {
  await actor(1);
  await rejects(`select public.complete_module('${id(301)}')`);
  await db.exec(
    `select public.complete_module('${id(300)}');select public.complete_module('${id(300)}');`,
  );
  assert.equal(await scalar("select count(*) from public.progress"), 1);
  await db.exec(`select public.complete_module('${id(301)}')`);
});
await test("XP is server-graded and awarded once", async () => {
  await actor(1);
  const wrong = await scalar(`select public.submit_answer('${id(400)}',0)`);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.xp, 0);
  const correct = await scalar(`select public.submit_answer('${id(400)}',1)`);
  assert.equal(correct.xp, 50);
  const again = await scalar(`select public.submit_answer('${id(400)}',1)`);
  assert.equal(again.xp, 0);
  await rejects(`select public.submit_answer('${id(400)}',99)`);
  await rejects("select * from private.question_answers");
});
await test("Submission rejects forged grade and other student identity", async () => {
  await actor(1);
  await rejects(
    `insert into public.submissions(assignment_id,student_id,body,grade,status) values('${id(520)}','${id(1)}','Resposta suficientemente longa para a atividade.',10,'reviewed')`,
  );
  await rejects(
    `insert into public.submissions(assignment_id,student_id,body) values('${id(520)}','${id(5)}','Resposta suficientemente longa para a atividade.')`,
  );
  await db.exec(
    `insert into public.submissions(id,assignment_id,student_id,body) values('${id(530)}','${id(520)}','${id(1)}','Resposta suficientemente longa para a atividade.')`,
  );
  await rejects(`update public.submissions set grade=10 where id='${id(530)}'`);
});
await test("Only responsible teacher/institution can grade", async () => {
  await actor(6);
  await rejects(
    `select public.grade_submission('${id(530)}',10,'Muito bom trabalho e documentação.')`,
  );
  await actor(2);
  await db.exec(
    `select public.grade_submission('${id(530)}',8.5,'Revise os casos de fronteira e explique o algoritmo.')`,
  );
  await actor(1);
  assert.equal(
    Number(
      await scalar(
        `select grade from public.submissions where id='${id(530)}'`,
      ),
    ),
    8.5,
  );
  assert.equal(
    (
      await db.query(
        `update public.submissions set body='Tentativa de trocar depois da correção.' where id='${id(530)}' returning id`,
      )
    ).rows.length,
    0,
  );
});
await test("Candidate profile stays private until application", async () => {
  await actor(3);
  assert.equal(
    (await db.query(`select id from public.profiles where id='${id(1)}'`)).rows
      .length,
    0,
  );
  await actor(1);
  await rejects(
    `insert into public.applications(job_id,student_id,cover_letter,status) values('${id(800)}','${id(1)}','Tenho interesse e habilidades nesta oportunidade.','accepted')`,
  );
  await db.exec(
    `insert into public.applications(id,job_id,student_id,cover_letter) values('${id(810)}','${id(800)}','${id(1)}','Tenho interesse e habilidades nesta oportunidade.')`,
  );
  await actor(3);
  assert.equal(
    (await db.query(`select id from public.profiles where id='${id(1)}'`)).rows
      .length,
    1,
  );
});
await test("Experience ownership and candidate sharing are enforced", async () => {
  await actor(1);
  await db.exec(
    `insert into public.experiences(id,user_id,title,organization,kind,description,started_on) values('${id(945)}','${id(1)}','Projeto escolar','Escola A','projeto','Protótipo da biblioteca da turma.','2026-09-01')`,
  );
  await actor(5);
  assert.equal(await scalar("select count(*) from public.experiences"), 0);
  await rejects(
    `insert into public.experiences(user_id,title,organization,kind,description,started_on) values('${id(1)}','Registro falso','Escola A','projeto','Não deveria ser permitido.','2026-09-01')`,
  );
  await actor(3);
  assert.equal(await scalar("select count(*) from public.experiences"), 1);
  assert.equal(
    (
      await db.query(
        `delete from public.experiences where id='${id(945)}' returning id`,
      )
    ).rows.length,
    0,
  );
});
await test("Application status permissions and withdrawal enforced", async () => {
  await actor(1);
  await rejects(
    `select public.set_application_status('${id(810)}','accepted')`,
  );
  await actor(5);
  await rejects(
    `select public.set_application_status('${id(810)}','interview')`,
  );
  await actor(3);
  await db.exec(
    `select public.set_application_status('${id(810)}','interview')`,
  );
  await actor(1);
  await db.exec(
    `select public.set_application_status('${id(810)}','withdrawn')`,
  );
  await actor(3);
  await rejects(
    `select public.set_application_status('${id(810)}','accepted')`,
  );
});
await test("Post authors are stamped; users cannot forge another author", async () => {
  await actor(1);
  await rejects(
    `insert into public.posts(user_id,kind,category,title,body) values('${id(5)}','feed','Programação','Outro autor','Texto de uma postagem indevida.')`,
  );
  await db.exec(
    `insert into public.posts(id,user_id,author_name,kind,category,title,body) values('${id(600)}','${id(1)}','Nome falso','feed','Programação','Meu aprendizado','Uma publicação com conteúdo suficiente.')`,
  );
  assert.equal(
    await scalar(`select author_name from public.posts where id='${id(600)}'`),
    "Pessoa 1",
  );
});
await test("Chat only allows related accounts", async () => {
  await actor(1);
  await rejects(
    `insert into public.messages(sender_id,recipient_id,body) values('${id(1)}','${id(5)}','Mensagem sem vínculo')`,
  );
  await db.exec(
    `insert into public.messages(sender_id,recipient_id,body) values('${id(1)}','${id(2)}','Dúvida sobre a atividade')`,
  );
  await actor(5);
  assert.equal(await scalar("select count(*) from public.messages"), 0);
});
await test("Private storage denies other users documents", async () => {
  await actor(1);
  await db.exec(
    `insert into storage.objects(bucket_id,name) values('profile-documents','${id(1)}/documento.pdf')`,
  );
  await actor(5);
  assert.equal(
    await scalar(
      "select count(*) from storage.objects where bucket_id='profile-documents'",
    ),
    0,
  );
  await rejects(
    `insert into storage.objects(bucket_id,name) values('profile-documents','${id(1)}/fraude.pdf')`,
  );
});
await test("Certificate requires all modules and supervising staff", async () => {
  await actor(2);
  await rejects(`select public.issue_certificate('${id(1)}','${id(200)}')`);
  await actor(1);
  for (let i = 302; i <= 306; i++)
    await db.exec(`select public.complete_module('${id(i)}')`);
  await rejects(`select public.issue_certificate('${id(1)}','${id(200)}')`);
  await actor(2);
  await db.exec(`select public.issue_certificate('${id(1)}','${id(200)}')`);
  assert.equal(await scalar("select count(*) from public.certificates"), 1);
});
await test("Anonymous cannot access private tables; verification is narrow", async () => {
  await admin();
  const code = await scalar(
    "select verification_code from public.certificates limit 1",
  );
  await actor(null);
  await rejects("select * from public.profiles");
  await rejects("select * from public.jobs");
  assert.equal(
    (await db.query(`select * from public.verify_certificate('${code}')`)).rows
      .length,
    1,
  );
  await rejects(`select public.complete_module('${id(300)}')`);
});
await test("Support is private until explicit sharing with an affiliated teacher", async () => {
  await actor(1);
  await db.exec(
    `insert into public.support_tickets(id,user_id,topic,urgency,summary) values('${id(950)}','${id(1)}','Acesso','Alta','Preciso de orientação para entrar no ambiente de estudos.')`,
  );
  await actor(2);
  assert.equal(await scalar("select count(*) from public.support_tickets"), 0);
  await actor(1);
  await rejects(`select public.route_support_ticket('${id(950)}','${id(6)}')`);
  await db.exec(`select public.route_support_ticket('${id(950)}','${id(2)}')`);
  await actor(2);
  assert.equal(await scalar("select count(*) from public.support_tickets"), 1);
  await actor(6);
  await rejects(
    `select public.answer_support_ticket('${id(950)}','Resposta de um docente sem vínculo.')`,
  );
  await actor(2);
  await db.exec(
    `select public.answer_support_ticket('${id(950)}','Use recuperar senha e confira o e-mail de confirmação.')`,
  );
  await actor(1);
  assert.equal(
    await scalar("select status from public.support_tickets"),
    "answered",
  );
});
await test("MFA enforced by RLS and RPC, not only frontend", async () => {
  await admin();
  await db.exec(
    `insert into auth.mfa_factors(user_id,status) values('${id(1)}','verified')`,
  );
  await actor(1, "aal1");
  assert.equal(await scalar("select count(*) from public.profiles"), 0);
  await rejects(`select public.complete_module('${id(300)}')`);
  await actor(1, "aal2");
  assert.equal(
    await scalar(`select count(*) from public.profiles where id='${id(1)}'`),
    1,
  );
});

// These cases retain an otherwise valid JWT. The database must fail closed.
for (const [name, setup, restore] of [
  [
    "Unconfirmed email",
    `update auth.users set email_confirmed_at=null where id='${id(1)}'`,
    `update auth.users set email_confirmed_at=now() where id='${id(1)}'`,
  ],
  [
    "Banned account",
    `update auth.users set banned_until=now()+interval '1 day' where id='${id(1)}'`,
    `update auth.users set banned_until=null where id='${id(1)}'`,
  ],
  [
    "Anonymous account",
    `update auth.users set is_anonymous=true where id='${id(1)}'`,
    `update auth.users set is_anonymous=false where id='${id(1)}'`,
  ],
  [
    "Revoked session",
    `delete from auth.sessions where id='${id(1)}'`,
    `insert into auth.sessions(id,user_id) values('${id(1)}','${id(1)}')`,
  ],
  [
    "Expired session",
    `update auth.sessions set not_after=now()-interval '1 minute' where id='${id(1)}'`,
    `update auth.sessions set not_after=null where id='${id(1)}'`,
  ],
  [
    "Session belonging to another account",
    `update auth.sessions set user_id='${id(5)}' where id='${id(1)}'`,
    `update auth.sessions set user_id='${id(1)}' where id='${id(1)}'`,
  ],
]) {
  await test(`${name} cannot read, write, call RPC or access private storage`, async () => {
    await admin();
    await db.exec(setup);
    try {
      await actor(1, "aal2");
      assert.equal(await scalar("select count(*) from public.profiles"), 0);
      assert.equal(await scalar("select count(*) from public.user_roles"), 0);
      assert.equal(await scalar("select count(*) from storage.objects"), 0);
      await rejects(
        `insert into public.posts(user_id,kind,category,title,body) values('${id(1)}','feed','Teste','Título bloqueado','Não deve aceitar uma sessão inválida.')`,
      );
      await rejects(`select public.complete_module('${id(300)}')`);
      await rejects(
        `insert into storage.objects(bucket_id,name) values('profile-documents','${id(1)}/bloqueado.pdf')`,
      );
    } finally {
      await admin();
      await db.exec(restore);
    }
  });
}
await test("Account without a provisioned role cannot use student RPCs", async () => {
  await admin();
  await db.exec(`delete from public.user_roles where user_id='${id(7)}'`);
  await actor(7);
  assert.equal(await scalar("select count(*) from public.profiles"), 0);
  await rejects(`select public.complete_module('${id(300)}')`);
});
await test("JWT without a session identifier is refused", async () => {
  await actor(1, "aal2");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ sub: id(1), aal: "aal2" }),
  ]);
  assert.equal(await scalar("select count(*) from public.profiles"), 0);
  await rejects(`select public.complete_module('${id(300)}')`);
});

await testLearning({ db, id, test, actor, admin, rejects, scalar });
await admin();
await test("Every exposed app table has RLS", async () => {
  const rows = (
    await db.query(
      "select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity",
    )
  ).rows;
  assert.equal(rows.length, 0);
});
await writeFile(
  "docs/rls-results.json",
  JSON.stringify(
    {
      engine:
        "PostgreSQL via PGlite; auth and storage APIs mocked, real RLS executed",
      tests: results,
    },
    null,
    2,
  ),
);
await db.close();
if (results.some((r) => r.status === "fail")) process.exitCode = 1;
console.log(
  `${results.filter((r) => r.status === "pass").length}/${results.length} security checks passed.`,
);
