import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { requireSupabase } from "../services/supabase";
import type { Assignment, Submission } from "../lib/types";
import { dateLabel, downloadBlob, percent, uid } from "../lib/utils";
import {
  ActionFeedback,
  ActionLink,
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Heading,
  Icon,
  Modal,
  Notice,
  ProgressBar,
  SectionTitle,
  useAction,
} from "../components/ui";
import { MaterialEditor } from "./Materials";
import { Tracks } from "./Learning";
export function Classrooms() {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    [create, setCreate] = useState(false),
    [addStudent, setAddStudent] = useState<string | null>(null),
    [newAssignment, setNewAssignment] = useState<string | null>(null),
    [remove, setRemove] = useState<string | null>(null);
  const classes = repo.data.classes.filter((c) =>
    auth.role === "instituicao"
      ? c.organization_id === auth.organizationId
      : auth.role === "docente"
        ? c.teacher_id === auth.id
        : repo.data.enrollments.some(
            (e) => e.class_id === c.id && e.user_id === auth.id,
          ),
  );
  return (
    <div className="stack">
      <Heading
        title="Turmas e estudantes"
        description="Acompanhe matrículas, conteúdos e atividades."
        action={
          auth.role === "instituicao" ? (
            <Button icon="plus" onClick={() => setCreate(true)}>
              Nova turma
            </Button>
          ) : undefined
        }
      />
      {classes.map((c) => (
        <Card key={c.id}>
          <div className="row-between">
            <div>
              <Badge>{c.subject}</Badge>
              <h2>{c.title}</h2>
              <p>
                Docente:{" "}
                {repo.data.profiles.find((p) => p.id === c.teacher_id)
                  ?.full_name || "Conta vinculada"}
              </p>
            </div>
            <Badge>
              {repo.data.enrollments.filter((e) => e.class_id === c.id).length}{" "}
              estudante(s)
            </Badge>
          </div>
          <div className="actions">
            {["docente", "instituicao"].includes(auth.role!) && (
              <Button
                variant="outline"
                icon="plus"
                onClick={() => setNewAssignment(c.id)}
              >
                Nova atividade
              </Button>
            )}
            {auth.role === "instituicao" && (
              <Button
                variant="outline"
                icon="users"
                onClick={() => setAddStudent(c.id)}
              >
                Matricular estudante
              </Button>
            )}
            <ActionLink to="/app/atividades" variant="ghost">
              Ver atividades
            </ActionLink>
          </div>
          <details className="class-members">
            <summary>Estudantes matriculados</summary>
            {repo.data.enrollments
              .filter((e) => e.class_id === c.id)
              .map((e) => (
                <div className="list-row" key={e.id}>
                  <span>
                    {repo.data.profiles.find((p) => p.id === e.user_id)
                      ?.full_name || "Estudante"}
                  </span>
                  <div className="actions">
                    {e.user_id !== auth.id && (
                      <ActionLink
                        to={`/app/mensagens?para=${e.user_id}`}
                        variant="ghost"
                      >
                        Mensagem
                      </ActionLink>
                    )}
                    {auth.role === "instituicao" && (
                      <Button variant="ghost" onClick={() => setRemove(e.id)}>
                        Remover matrícula
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </details>
        </Card>
      ))}
      {!classes.length && (
        <Empty title="Nenhuma turma disponível">
          A instituição precisa vincular docentes e estudantes no servidor antes
          de criar matrículas.
        </Empty>
      )}
      <ActionFeedback action={action} />
      {create && (
        <Modal title="Nova turma" onClose={() => setCreate(false)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void action.run(async () => {
                await repo.add("classes", {
                  id: uid(),
                  organization_id: auth.organizationId!,
                  teacher_id: String(f.get("teacher")),
                  title: String(f.get("title")).trim(),
                  subject: String(f.get("subject")),
                });
                setCreate(false);
              });
            }}
          >
            <label>
              Nome da turma
              <input name="title" maxLength={160} required />
            </label>
            <label>
              Matéria
              <input name="subject" maxLength={80} required />
            </label>
            <label>
              Docente vinculado
              <select name="teacher" required defaultValue="">
                <option value="" disabled>
                  Selecione um docente
                </option>
                {repo.data.user_roles
                  .filter(
                    (r) =>
                      r.role === "docente" &&
                      r.organization_id === auth.organizationId,
                  )
                  .map((r) => (
                    <option key={r.user_id} value={r.user_id}>
                      {repo.data.profiles.find((p) => p.id === r.user_id)
                        ?.full_name || r.user_id}
                    </option>
                  ))}
              </select>
            </label>
            <Button type="submit" disabled={action.busy}>
              Criar turma
            </Button>
            <ActionFeedback action={action} />
          </form>
        </Modal>
      )}
      {addStudent && (
        <Modal title="Matricular estudante" onClose={() => setAddStudent(null)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const user_id = String(
                new FormData(e.currentTarget).get("student"),
              );
              void action.run(async () => {
                await repo.add("enrollments", {
                  id: uid(),
                  class_id: addStudent,
                  user_id,
                  created_at: new Date().toISOString(),
                });
                setAddStudent(null);
              });
            }}
          >
            <p>
              Somente estudantes vinculados à sua instituição podem ser
              matriculados.
            </p>
            <label>
              Estudante
              <select name="student" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {repo.data.user_roles
                  .filter(
                    (r) =>
                      r.role === "estudante" &&
                      r.organization_id === auth.organizationId &&
                      !repo.data.enrollments.some(
                        (e) =>
                          e.class_id === addStudent && e.user_id === r.user_id,
                      ),
                  )
                  .map((r) => (
                    <option key={r.user_id} value={r.user_id}>
                      {repo.data.profiles.find((p) => p.id === r.user_id)
                        ?.full_name || r.user_id}
                    </option>
                  ))}
              </select>
            </label>
            <Button type="submit" disabled={action.busy}>
              Confirmar matrícula
            </Button>
            <ActionFeedback action={action} />
          </form>
        </Modal>
      )}
      {newAssignment && (
        <AssignmentEditor
          classId={newAssignment}
          onClose={() => setNewAssignment(null)}
        />
      )}{" "}
      {remove && (
        <Confirm
          title="Remover matrícula?"
          onClose={() => setRemove(null)}
          onConfirm={() => repo.remove("enrollments", remove)}
        >
          O estudante deixará de acessar as atividades desta turma. Seu
          histórico de envios será preservado.
        </Confirm>
      )}
    </div>
  );
}
function AssignmentEditor({
  classId,
  onClose,
}: {
  classId: string;
  onClose: () => void;
}) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction();
  return (
    <Modal title="Nova atividade" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            await repo.add("assignments", {
              id: uid(),
              class_id: classId,
              teacher_id:
                repo.data.classes.find((c) => c.id === classId)?.teacher_id ||
                auth.id!,
              title: String(f.get("title")).trim(),
              instructions: String(f.get("instructions")).trim(),
              due_at: new Date(String(f.get("due"))).toISOString(),
            });
            onClose();
          });
        }}
      >
        <label>
          Título
          <input name="title" maxLength={160} required />
        </label>
        <label>
          Instruções e critérios
          <textarea
            name="instructions"
            rows={6}
            minLength={20}
            maxLength={5000}
            required
          />
        </label>
        <label>
          Prazo (horário local)
          <input type="datetime-local" name="due" required />
        </label>
        <Button type="submit" disabled={action.busy}>
          Publicar atividade
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
export function Activities() {
  const auth = useAuth(),
    repo = useData(),
    [classId, setClassId] = useState(""),
    [status, setStatus] = useState("Todos"),
    [selected, setSelected] = useState<Submission | null>(null),
    [activity, setActivity] = useState<Assignment | null>(null);
  const staff = auth.role === "docente" || auth.role === "instituicao";
  const assignments = repo.data.assignments.filter(
      (a) => !classId || a.class_id === classId,
    ),
    submissions = repo.data.submissions.filter(
      (s) =>
        assignments.some((a) => a.id === s.assignment_id) &&
        (status === "Todos" || s.status === status),
    );
  const graded = submissions.filter((s) => s.grade !== null),
    avg = graded.length
      ? (
          graded.reduce((s, a) => s + (a.grade || 0), 0) / graded.length
        ).toFixed(1)
      : "—";
  return (
    <div className="stack">
      <Heading
        title={staff ? "Atividades e avaliações" : "Atividades da turma"}
        description={
          staff
            ? "Revise os envios e forneça feedback específico aos estudantes."
            : "Leia os critérios, envie sua resposta e acompanhe o feedback."
        }
        action={
          staff ? (
            <ActionLink to="/app/turmas" variant="outline" icon="plus">
              Criar atividade
            </ActionLink>
          ) : undefined
        }
      />
      <div className="stats-grid cards">
        <Card>
          <strong>
            {submissions.filter((s) => s.status === "submitted").length}
          </strong>
          <span>{staff ? "Para corrigir" : "Enviadas"}</span>
        </Card>
        <Card>
          <strong>{assignments.length}</strong>
          <span>Atividades</span>
        </Card>
        <Card>
          <strong>{avg}</strong>
          <span>Média dos envios corrigidos</span>
        </Card>
      </div>
      <div className="filters">
        <label>
          Turma
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Todas as turmas</option>
            {repo.data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {staff && (
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Todos</option>
              <option value="submitted">Pendentes</option>
              <option value="reviewed">Corrigidos</option>
            </select>
          </label>
        )}
      </div>
      {staff ? (
        <Card>
          <h2>Fila de atividades</h2>
          {submissions.map((s) => (
            <div className="list-row" key={s.id}>
              <div>
                <strong>
                  {
                    repo.data.assignments.find((a) => a.id === s.assignment_id)
                      ?.title
                  }
                </strong>
                <small>
                  {repo.data.profiles.find((p) => p.id === s.student_id)
                    ?.full_name || "Estudante"}{" "}
                  · {dateLabel(s.created_at)}
                </small>
              </div>
              <Button variant="outline" onClick={() => setSelected(s)}>
                {s.status === "reviewed" ? "Rever correção" : "Corrigir"}
              </Button>
            </div>
          ))}
          {!submissions.length && <Empty title="Nenhum envio nesta fila" />}
        </Card>
      ) : (
        <div className="two-columns">
          {assignments.map((a) => {
            const submitted = repo.data.submissions.find(
              (s) => s.assignment_id === a.id && s.student_id === auth.id,
            );
            return (
              <Card key={a.id}>
                <Badge>
                  {submitted
                    ? submitted.status === "reviewed"
                      ? `Nota ${submitted.grade}`
                      : "Enviada"
                    : "Pendente"}
                </Badge>
                <h2>{a.title}</h2>
                <p>Entrega até {dateLabel(a.due_at)}</p>
                <Button onClick={() => setActivity(a)} variant="outline">
                  {submitted ? "Ver envio e feedback" : "Abrir atividade"}
                </Button>
              </Card>
            );
          })}
          {!assignments.length && <Empty title="Nenhuma atividade publicada" />}
        </div>
      )}
      {selected && (
        <Review submission={selected} onClose={() => setSelected(null)} />
      )}{" "}
      {activity && (
        <SubmissionEditor
          assignment={activity}
          onClose={() => setActivity(null)}
        />
      )}
    </div>
  );
}
function Review({
  submission,
  onClose,
}: {
  submission: Submission;
  onClose: () => void;
}) {
  const repo = useData(),
    action = useAction();
  return (
    <Modal title="Correção da atividade" onClose={onClose}>
      <h3>
        {
          repo.data.assignments.find((a) => a.id === submission.assignment_id)
            ?.title
        }
      </h3>
      <p className="pre-wrap reading-content">{submission.body}</p>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            await repo.grade(
              submission.id,
              Number(f.get("grade")),
              String(f.get("feedback")).trim(),
            );
            onClose();
          });
        }}
      >
        <label>
          Nota (0 a 10)
          <input
            name="grade"
            type="number"
            min={0}
            max={10}
            step={0.1}
            defaultValue={submission.grade ?? ""}
            required
          />
        </label>
        <label>
          Feedback
          <textarea
            name="feedback"
            rows={5}
            defaultValue={submission.feedback || ""}
            minLength={10}
            maxLength={4000}
            required
          />
        </label>
        <Button type="submit" disabled={action.busy}>
          Salvar avaliação
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
function SubmissionEditor({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    existing = repo.data.submissions.find(
      (s) => s.assignment_id === assignment.id && s.student_id === auth.id,
    );
  const late = new Date(assignment.due_at).getTime() < Date.now();
  return (
    <Modal title={assignment.title} onClose={onClose}>
      <p className="pre-wrap">{assignment.instructions}</p>
      <p className="muted">Prazo: {dateLabel(assignment.due_at)}</p>
      {existing?.status === "reviewed" ? (
        <>
          <Notice tone="success">
            Nota {existing.grade} · {existing.feedback}
          </Notice>
          <p className="pre-wrap">{existing.body}</p>
        </>
      ) : (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const body = String(
              new FormData(e.currentTarget).get("body"),
            ).trim();
            void action.run(async () => {
              if (existing)
                await repo.update("submissions", existing.id, { body });
              else
                await repo.add("submissions", {
                  id: uid(),
                  assignment_id: assignment.id,
                  student_id: auth.id!,
                  body,
                  grade: null,
                  feedback: null,
                  status: "submitted",
                  created_at: new Date().toISOString(),
                });
              onClose();
            });
          }}
        >
          {late && (
            <Notice tone="warning">
              O prazo terminou. O envio ficará registrado com a data atual para
              avaliação do docente.
            </Notice>
          )}
          <label>
            Sua resposta
            <textarea
              name="body"
              defaultValue={existing?.body}
              rows={9}
              minLength={20}
              maxLength={20000}
              required
            />
          </label>
          <Button type="submit" disabled={action.busy}>
            {existing ? "Atualizar resposta" : "Enviar atividade"}
          </Button>
          <ActionFeedback action={action} />
        </form>
      )}
    </Modal>
  );
}
export function InstitutionLearning() {
  const [material, setMaterial] = useState(false);
  return (
    <div className="stack">
      <Heading
        title="Gestão de aprendizagem"
        description="Organize o catálogo, acompanhe as turmas e publique conteúdos."
      />
      <div className="quick-actions">
        <ActionLink to="/app/turmas" variant="outline" icon="users">
          Turmas e matrículas
        </ActionLink>
        <Button
          variant="outline"
          icon="upload"
          onClick={() => setMaterial(true)}
        >
          Publicar conteúdo
        </Button>
        <ActionLink to="/app/atividades" variant="outline" icon="clipboard">
          Avaliações
        </ActionLink>
        <ActionLink to="/app/certificados" variant="outline" icon="award">
          Certificações
        </ActionLink>
      </div>
      <Tracks embedded />
      {material && <MaterialEditor onClose={() => setMaterial(false)} />}
    </div>
  );
}
export function Reports() {
  const auth = useAuth(),
    { data } = useData(),
    action = useAction();
  const applications = data.applications.filter((a) =>
      data.jobs.some((j) => j.id === a.job_id && j.owner_id === auth.id),
    ),
    grades = data.submissions.filter((s) => s.grade !== null);
  const records =
    auth.role === "recrutador"
      ? [
          [
            "Vagas próprias",
            data.jobs.filter((j) => j.owner_id === auth.id).length,
          ],
          ["Candidaturas", applications.length],
          [
            "Em entrevista",
            applications.filter((a) => a.status === "interview").length,
          ],
          [
            "Aprovadas",
            applications.filter((a) => a.status === "accepted").length,
          ],
        ]
      : [
          ["Turmas visíveis", data.classes.length],
          ["Matrículas", data.enrollments.length],
          ["Atividades publicadas", data.assignments.length],
          ["Envios", data.submissions.length],
          ["Envios corrigidos", grades.length],
          ["Comprovantes internos", data.certificates.length],
        ];
  return (
    <div className="stack">
      <Heading
        title="Relatório de acompanhamento"
        description="Indicadores calculados sobre os registros permitidos para sua conta."
      />
      <Notice>
        Os indicadores refletem registros do SkillUp. Não representam
        frequência, contratação efetiva ou dados de sistemas externos.
      </Notice>
      <div className="stats-grid cards">
        {records.map(([label, value]) => (
          <Card key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </Card>
        ))}
      </div>
      <Button
        variant="outline"
        icon="download"
        onClick={() =>
          action.run(async () => {
            downloadBlob(
              new Blob(
                [
                  "\uFEFFIndicador;Valor\n" +
                    records.map((r) => r.join(";")).join("\n"),
                ],
                { type: "text/csv;charset=utf-8" },
              ),
              "skillup-indicadores.csv",
            );
          }, "Relatório preparado para download.")
        }
      >
        Exportar indicadores em CSV
      </Button>
      <ActionFeedback action={action} />
    </div>
  );
}
export function Certificates() {
  const auth = useAuth(),
    repo = useData(),
    [issuing, setIssuing] = useState(false),
    action = useAction();
  const own = repo.data.certificates.filter((c) =>
      auth.role === "estudante" ? c.user_id === auth.id : true,
    ),
    completed = repo.data.tracks.filter((t) => {
      const modules = repo.data.modules.filter((m) => m.track_id === t.id);
      return (
        modules.length &&
        modules.every((m) =>
          repo.data.progress.some(
            (p) => p.user_id === auth.id && p.module_id === m.id,
          ),
        )
      );
    });
  return (
    <div className="stack">
      <Heading
        title="Conquistas e comprovantes"
        description="Acompanhe etapas concluídas e registros emitidos pela sua instituição."
        action={
          ["docente", "instituicao"].includes(auth.role!) ? (
            <Button icon="award" onClick={() => setIssuing(true)}>
              Emitir comprovante interno
            </Button>
          ) : undefined
        }
      />
      <Notice>
        Comprovantes do SkillUp são registros internos. Não há validação
        MEC/SENAI, blockchain ou equivalência automática a certificações
        profissionais.
      </Notice>
      <SectionTitle>Trilhas concluídas</SectionTitle>
      <div className="two-columns">
        {completed.map((t) => (
          <Card key={t.id}>
            <Icon name="award" size={32} />
            <h2>{t.title}</h2>
            <Badge tone="success">Conteúdo concluído</Badge>
            <p>
              A conclusão de leitura não equivale a aprovação em uma avaliação
              externa.
            </p>
          </Card>
        ))}
      </div>
      <SectionTitle>Comprovantes emitidos</SectionTitle>
      {own.map((c) => (
        <Card key={c.id}>
          <Badge>Registro interno{auth.demo ? " de exemplo" : ""}</Badge>
          <h2>{repo.data.tracks.find((t) => t.id === c.track_id)?.title}</h2>
          <p>
            {repo.data.profiles.find((p) => p.id === c.user_id)?.full_name} ·{" "}
            {dateLabel(c.issued_at)}
          </p>
          <p className="small break-word">Código: {c.verification_code}</p>
          {!auth.demo && (
            <ActionLink
              to={`/verificar/${c.verification_code}`}
              variant="outline"
            >
              Verificar registro
            </ActionLink>
          )}
          <Button
            variant="ghost"
            onClick={() => window.print()}
            icon="download"
          >
            Imprimir comprovantes
          </Button>
        </Card>
      ))}
      {!own.length && (
        <Empty title="Nenhum comprovante emitido">
          Após concluir uma trilha, sua instituição poderá revisar e emitir um
          registro interno.
        </Empty>
      )}
      {issuing && (
        <Modal
          title="Emitir comprovante interno"
          onClose={() => setIssuing(false)}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                user = String(f.get("student")),
                track = String(f.get("track"));
              void action.run(async () => {
                if (auth.demo) {
                  const modules = repo.data.modules.filter(
                    (m) => m.track_id === track,
                  );
                  if (
                    !modules.length ||
                    !modules.every((m) =>
                      repo.data.progress.some(
                        (p) => p.user_id === user && p.module_id === m.id,
                      ),
                    )
                  )
                    throw new Error(
                      "O estudante ainda não concluiu todos os módulos desta trilha.",
                    );
                  await repo.add("certificates", {
                    id: uid(),
                    user_id: user,
                    track_id: track,
                    issued_by: auth.id!,
                    issued_at: new Date().toISOString(),
                    verification_code: uid(),
                  });
                } else {
                  const { error } = await requireSupabase().rpc(
                    "issue_certificate",
                    { p_student_id: user, p_track_id: track },
                  );
                  if (error) throw error;
                  await repo.reload();
                }
                setIssuing(false);
              });
            }}
          >
            <label>
              Estudante
              <select name="student" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {repo.data.profiles
                  .filter((p) =>
                    repo.data.enrollments.some((e) => e.user_id === p.id),
                  )
                  .map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.full_name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Trilha
              <select name="track" required>
                {repo.data.tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <p>
              O servidor verificará a conclusão e seu vínculo com o estudante.
            </p>
            <Button type="submit" disabled={action.busy}>
              Confirmar emissão interna
            </Button>
            <ActionFeedback action={action} />
          </form>
        </Modal>
      )}
    </div>
  );
}
export function VerifyCertificate() {
  const { code } = useParams(),
    [result, setResult] = useState<{
      full_name: string;
      title: string;
      issued_at: string;
    } | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      requireSupabase()
        .rpc("verify_certificate", { p_code: code })
        .then(({ data, error }) => {
          if (error) setError(error.message);
          else setResult(data?.[0] || null);
          setLoading(false);
        });
    } catch {
      setError("A verificação real não está configurada.");
      setLoading(false);
    }
  }, [code]);
  return (
    <main className="standalone stack">
      <Link to="/">SkillUp</Link>
      <Heading title="Verificação de registro interno" />
      {loading ? (
        <p>Consultando registro…</p>
      ) : result ? (
        <Card>
          <Badge tone="success">Registro localizado</Badge>
          <h2>{result.title}</h2>
          <p>Emitido para {result.full_name}</p>
          <p>{dateLabel(result.issued_at)}</p>
          <p className="break-word">{code}</p>
        </Card>
      ) : (
        <Notice tone="warning">
          {error || "Não foi encontrado um registro com este código."}
        </Notice>
      )}
      <Notice>
        Esta consulta confirma apenas a existência do registro no SkillUp. Não
        comprova reconhecimento MEC/SENAI.
      </Notice>
    </main>
  );
}
