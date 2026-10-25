import { activityType, activityLabels } from "../services/activities";
import { ActivityRenderer } from "../components/ActivityRenderer";
import {
  PracticeSession,
  type PracticeSet,
} from "../components/PracticeSession";
import { practiceSets } from "../data/catalog";
import { initialAnswer, answerReady } from "../components/ExerciseFields";
import type { ExerciseAnswer } from "../lib/types";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { percent, matches, dateLabel, uid } from "../lib/utils";
import {
  ActionFeedback,
  ActionLink,
  Badge,
  Button,
  Card,
  Empty,
  Heading,
  Icon,
  Modal,
  Notice,
  ProgressBar,
  SearchField,
  SectionTitle,
  useAction,
} from "../components/ui";
export function Tracks({ embedded = false }: { embedded?: boolean }) {
  const auth = useAuth(),
    { data } = useData(),
    [query, setQuery] = useState(""),
    [creating, setCreating] = useState(false);
  const tracks = data.tracks.filter((t) =>
    matches(query, t.title, t.skills.join(" ")),
  );
  return (
    <div className="stack">
      <Heading
        level={embedded ? 2 : 1}
        title={
          auth.role === "recrutador"
            ? "Explore as trilhas"
            : "Trilhas de aprendizagem"
        }
        description={
          auth.role === "recrutador"
            ? "Conheça os conteúdos e as competências trabalhadas."
            : "Uma etapa de cada vez, no seu ritmo."
        }
        action={
          ["docente", "instituicao"].includes(auth.role!) ? (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Nova trilha
            </Button>
          ) : (
            <ActionLink variant="outline" to="/app/certificados" icon="award">
              Conquistas
            </ActionLink>
          )
        }
      />
      <SearchField
        value={query}
        onChange={setQuery}
        label="Buscar trilhas ou competências"
      />
      <div className="two-columns">
        {tracks.map((t) => {
          const modules = data.modules.filter((m) => m.track_id === t.id),
            count = modules.filter((m) =>
              data.progress.some(
                (p) => p.user_id === auth.id && p.module_id === m.id,
              ),
            ).length;
          return (
            <Card key={t.id}>
              <Badge>{t.category}</Badge>
              <h2>{t.title}</h2>
              <p>{t.description}</p>
              <p className="small muted">
                {t.difficulty || "Iniciante"} · {t.duration_hours} horas ·{" "}
                {modules.length} módulos
              </p>
              <div className="chips">
                {t.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              {auth.role === "estudante" && (
                <ProgressBar
                  value={percent(count, modules.length)}
                  label="Seu progresso"
                />
              )}
              <ActionLink to={`/app/aprenda/trilhas/${t.id}`} icon="play">
                {count ||
                data.track_enrollments.some(
                  (e) => e.user_id === auth.id && e.track_id === t.id,
                )
                  ? "Continuar"
                  : "Ver trilha"}
              </ActionLink>
            </Card>
          );
        })}
      </div>
      {!tracks.length && <Empty title="Nenhuma trilha encontrada" />}
      {creating && <TrackEditor onClose={() => setCreating(false)} />}
    </div>
  );
}
export function TrackDetail() {
  const { trackId } = useParams(),
    auth = useAuth(),
    repo = useData(),
    [open, setOpen] = useState<string | null>(null),
    [creating, setCreating] = useState(false),
    [exercise, setExercise] = useState<string | null>(null),
    action = useAction();
  const track = repo.data.tracks.find((t) => t.id === trackId),
    modules = repo.data.modules
      .filter((m) => m.track_id === trackId)
      .sort((a, b) => a.position - b.position);
  const done = (id: string) =>
      repo.data.progress.some(
        (p) => p.user_id === auth.id && p.module_id === id,
      ),
    module = modules.find((m) => m.id === open),
    count = modules.filter((m) => done(m.id)).length;
  const canEdit =
    track?.owner_id === auth.id &&
    ["docente", "instituicao"].includes(auth.role!);
  if (!track) return <Empty title="Trilha não encontrada" />;
  return (
    <div className="stack">
      <Link className="back-link" to="/app/aprenda/trilhas">
        <Icon name="arrow" />
        Todas as trilhas
      </Link>
      <Heading
        title={track.title}
        description={track.description}
        action={
          canEdit ? (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Adicionar módulo
            </Button>
          ) : undefined
        }
      />
      {auth.role === "estudante" &&
        !repo.data.track_enrollments.some(
          (e) => e.user_id === auth.id && e.track_id === track.id,
        ) && (
          <Button
            disabled={action.busy}
            onClick={() =>
              action.run(
                () => repo.startTrack(track.id),
                "Trilha iniciada. Você pode estudar outras áreas em paralelo.",
              )
            }
          >
            Iniciar trilha
          </Button>
        )}
      {!module && <ActionFeedback action={action} />}
      <Card>
        <ProgressBar
          value={percent(count, modules.length)}
          label={`${count} de ${modules.length} etapas concluídas`}
        />
      </Card>
      <div className="trail-path">
        {modules.map((m, i) => {
          const locked =
            auth.role === "estudante" &&
            Boolean(m.prerequisite_id && !done(m.prerequisite_id));
          return (
            <button
              key={m.id}
              className={`trail-node ${done(m.id) ? "complete" : ""} ${locked ? "locked" : ""}`}
              disabled={locked}
              onClick={() => {
                setOpen(m.id);
                action.setSuccess("");
                action.setError("");
              }}
            >
              <span className="trail-icon">
                <Icon
                  name={done(m.id) ? "check" : locked ? "lock" : "play"}
                  size={24}
                />
              </span>
              <span>
                <strong>{m.title}</strong>
                <small>
                  {done(m.id)
                    ? "Concluído"
                    : locked
                      ? "Conclua a etapa anterior"
                      : `${i + 1}ª etapa · ${m.xp} XP`}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      {!modules.length && (
        <Empty title="Esta trilha ainda não tem módulos">
          O responsável precisa publicar o primeiro conteúdo.
        </Empty>
      )}
      <Card>
        <Icon name="award" />
        <h3>Tesouro do módulo</h3>
        <p>
          Conclua as etapas para acompanhar suas conquistas. Certificados
          oficiais dependem da instituição emissora.
        </p>
        <ActionLink to="/app/certificados" variant="outline">
          Ver conquistas e comprovantes
        </ActionLink>
      </Card>
      {module && (
        <Modal title={module.title} onClose={() => setOpen(null)}>
          <article className="reading-content">
            {module.body.split("\n\n").map((p, i) => (
              <p className="pre-wrap" key={i}>
                {p}
              </p>
            ))}
          </article>
          {module.question_id && (
            <Button
              variant="outline"
              onClick={() => {
                setExercise(module.question_id!);
                setOpen(null);
              }}
            >
              Abrir exercício da etapa
            </Button>
          )}
          {auth.role === "estudante" && (
            <Button
              icon="check"
              disabled={action.busy || done(module.id)}
              onClick={() =>
                action.run(async () => {
                  const status = await repo.completeModule(module.id);
                  action.setSuccess(
                    status === "saved"
                      ? "Etapa concluída. Progresso atualizado."
                      : "Conclusão na fila. Aguardando validação do servidor.",
                  );
                })
              }
            >
              {done(module.id) ? "Etapa concluída" : "Li e concluí esta etapa"}
            </Button>
          )}
          <ActionFeedback action={action} />
        </Modal>
      )}
      {exercise && (
        <QuestionDialog
          questionId={exercise}
          moduleId={
            repo.data.modules.find((m) => m.question_id === exercise)?.id
          }
          onClose={() => setExercise(null)}
        />
      )}
      {creating && (
        <ModuleEditor trackId={track.id} onClose={() => setCreating(false)} />
      )}
    </div>
  );
}
export function Practice() {
  const auth = useAuth(),
    { data } = useData();
  const attempts = data.attempts.filter((a) => a.user_id === auth.id),
    answeredQuestions = new Set(attempts.map((a) => a.question_id)).size,
    correctAttempts = attempts.filter((a) => a.correct).length,
    incorrectAttempts = attempts.length - correctAttempts,
    accuracy = percent(correctAttempts, attempts.length),
    xp = attempts.reduce((sum, a) => sum + a.xp, 0),
    [type, setType] = useState(""),
    [subject, setSubject] = useState(""),
    [format, setFormat] = useState(""),
    [open, setOpen] = useState<string | null>(null),
    [session, setSession] = useState<PracticeSet | null>(null),
    [showStats, setShowStats] = useState(false);
  const sets: PracticeSet[] =
    type === "Prática guiada"
      ? data.subjects.map((s) => ({
          id: s.id,
          title: `Prática de ${s.name}`,
          category: type,
          questionIds: data.questions
            .filter((q) => q.category === type && q.subject_id === s.id)
            .map((q) => q.id),
        }))
      : practiceSets.filter((s) => s.category === type);
  const visibleSets = sets.filter((s) =>
    s.questionIds.some((id) =>
      data.questions.some(
        (q) =>
          q.id === id &&
          (!subject || q.subject_id === subject) &&
          (!format || (q.kind || "choice") === format),
      ),
    ),
  );
  return (
    <div className="stack">
      <Heading
        title="Prática"
        description="Transforme o conteúdo em conhecimento com exercícios curtos."
      />
      {auth.role === "estudante" && (
        <section
          className="card practice-dashboard"
          aria-label="Painel de prática do aluno"
        >
          <div className="practice-dashboard-header">
            <div className="practice-dashboard-title">
              <Badge>Painel do aluno</Badge>
              <h2>Seu progresso na prática</h2>
              <p>Acompanhe suas questões, acertos e XP conquistados.</p>
            </div>
            <Button
              variant="outline"
              aria-expanded={showStats}
              aria-controls="practice-dashboard-details"
              onClick={() => setShowStats((shown) => !shown)}
            >
              {showStats ? "Ver menos" : "Ver mais"}
            </Button>
          </div>
          <div
            id="practice-dashboard-details"
            className="practice-dashboard-details"
            hidden={!showStats}
          >
            <dl className="practice-stats">
              <div>
                <dt>Questões respondidas</dt>
                <dd>{answeredQuestions}</dd>
              </div>
              <div>
                <dt>Tentativas</dt>
                <dd>{attempts.length}</dd>
              </div>
              <div>
                <dt>Acertos</dt>
                <dd>
                  {correctAttempts} <small>{accuracy}% de aproveitamento</small>
                </dd>
              </div>
              <div>
                <dt>Erros</dt>
                <dd>{incorrectAttempts}</dd>
              </div>
              <div>
                <dt>XP em prática</dt>
                <dd>{xp} XP</dd>
              </div>
            </dl>
            {!attempts.length && (
              <p className="muted practice-dashboard-empty">
                Responda a uma questão para começar a acompanhar seu progresso.
              </p>
            )}
          </div>
        </section>
      )}
      <div className="two-columns">
        <label>
          Disciplina
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setType("Prática guiada");
            }}
          >
            <option value="">Todas as matérias</option>
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Formato de exercício
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              setType("Prática guiada");
            }}
          >
            <option value="">Todos os formatos</option>
            {Object.entries({
              choice: "Múltipla escolha",
              true_false: "Verdadeiro ou falso",
              blank: "Completar lacunas",
              matching: "Relacionar colunas",
              ordering: "Ordenação",
              challenge: "Desafios práticos",
            }).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button variant="outline" onClick={() => setType("Prática guiada")}>
        Explorar exercícios das oito matérias
      </Button>
      <SectionTitle>Ações rápidas</SectionTitle>
      <div className="practice-grid">
        {[
          ["Exames", "file"],
          ["Exercício", "clipboard"],
          ["Dinâmica", "zap"],
        ].map(([label, icon]) => (
          <button
            key={label}
            onClick={() => setType(label)}
            aria-pressed={type === label}
          >
            <Icon name={icon} size={28} />
            <strong>{label}</strong>
          </button>
        ))}
      </div>
      {!type ? (
        <Card className="challenge">
          <Badge>Desafio do dia</Badge>
          <h2>Aprenda com atividades da sua área</h2>
          <p>
            As práticas de código ficam dentro das lições que precisam delas.
          </p>
          <ActionLink variant="outline" to="/app/aprenda/trilhas">
            Escolher uma trilha
          </ActionLink>
        </Card>
      ) : (
        <>
          <SectionTitle
            action={
              <Button variant="ghost" onClick={() => setType("")}>
                Voltar
              </Button>
            }
          >
            {type}
          </SectionTitle>
          <div className="two-columns">
            {visibleSets.map((set) => (
              <Card key={set.id}>
                <Badge>
                  {set.questionIds.length} questões ·{" "}
                  {type === "Exames" ? "Avançado" : "Prática"}
                </Badge>
                <h3>{set.title}</h3>
                <p>
                  {type === "Exames"
                    ? "Navegue livremente, revise as alternativas marcadas e finalize para receber a correção."
                    : "Um bloco completo para praticar e revisar seu aprendizado."}
                </p>
                <Button onClick={() => setSession(set)}>
                  {type === "Exames" ? "Iniciar exame" : "Iniciar prática"}
                </Button>
              </Card>
            ))}
          </div>
          {!visibleSets.length && (
            <Empty title="Nenhum bloco encontrado">
              Altere os filtros para encontrar outros blocos de questões.
            </Empty>
          )}
          {type === "Prática guiada" && (
            <>
              <SectionTitle>Questões avulsas para reforçar</SectionTitle>
              {data.questions
                .filter(
                  (q) =>
                    q.category === type &&
                    (!subject || q.subject_id === subject) &&
                    (!format || (q.kind || "choice") === format),
                )
                .map((q) => (
                  <Card key={q.id}>
                    <Badge>
                      {q.xp} XP{" "}
                      {q.kind === "challenge"
                        ? "na primeira conclusão autodeclarada"
                        : "na primeira resposta correta"}
                    </Badge>
                    <h3>{q.title}</h3>
                    <Button onClick={() => setOpen(q.id)}>Praticar</Button>
                  </Card>
                ))}
            </>
          )}
        </>
      )}
      <SectionTitle
        action={
          <ActionLink to="/app/atividades" variant="ghost">
            Atividades da turma
          </ActionLink>
        }
      >
        Histórico de prática
      </SectionTitle>
      <Card>
        {attempts.length ? (
          attempts
            .slice(-10)
            .reverse()
            .map((a) => (
              <div className="list-row" key={a.id}>
                <div>
                  <strong>
                    {data.questions.find((q) => q.id === a.question_id)?.title}
                  </strong>
                  <small>{dateLabel(a.created_at)}</small>
                </div>
                <Badge tone={a.correct ? "success" : ""}>
                  {a.correct ? "Correta" : "Revisar"} · {a.xp} XP
                </Badge>
              </div>
            ))
        ) : (
          <Empty title="Seu primeiro desafio está esperando">
            Escolha uma ação rápida para começar.
          </Empty>
        )}
      </Card>
      {session && (
        <PracticeSession
          key={session.id}
          set={session}
          onClose={() => setSession(null)}
        />
      )}
      {open && (
        <QuestionDialog questionId={open} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
export function QuestionDialog({
  questionId,
  moduleId,
  onClose,
}: {
  questionId: string;
  moduleId?: string;
  onClose: () => void;
}) {
  const repo = useData(),
    q = repo.data.questions.find((x) => x.id === questionId),
    [selected, setSelected] = useState<ExerciseAnswer>(
      q ? initialAnswer(q) : -1,
    ),
    [result, setResult] = useState<{
      correct: boolean;
      xp: number;
      explanation: string;
    } | null>(null),
    action = useAction();
  if (!q) return null;
  return (
    <Modal
      title={q.title}
      onClose={() => {
        if (!action.busy) onClose();
      }}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (answerReady(q, selected))
            void action.run(async () =>
              setResult(await repo.answer(questionId, selected)),
            );
        }}
      >
        <Badge>{activityLabels[activityType(q)]}</Badge>
        {moduleId && (
          <ProgressBar
            value={result?.correct ? 100 : 0}
            label="Atividade da etapa"
          />
        )}
        <p>{q.prompt}</p>
        <ActivityRenderer
          q={q}
          value={selected}
          onChange={setSelected}
          disabled={Boolean(result) || action.busy}
        />
        {result ? (
          <>
            <Notice tone={result.correct ? "success" : "warning"}>
              <strong>
                {result.correct
                  ? q.kind === "challenge"
                    ? "Relato registrado!"
                    : "Resposta correta!"
                  : "Vamos revisar."}
              </strong>{" "}
              {result.explanation} {result.xp > 0 && `+${result.xp} XP`}
            </Notice>
            {result.correct && moduleId && (
              <Button
                disabled={action.busy}
                onClick={() =>
                  action.run(async () => {
                    await repo.completeModule(moduleId);
                    onClose();
                  })
                }
              >
                Concluir etapa
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setSelected(initialAnswer(q));
              }}
            >
              Praticar novamente
            </Button>
          </>
        ) : (
          <Button
            type="submit"
            disabled={!answerReady(q, selected) || action.busy}
          >
            {activityType(q) === "code_practice"
              ? "Validar atividade"
              : "Conferir resposta"}
          </Button>
        )}
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
function TrackEditor({ onClose }: { onClose: () => void }) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction();
  return (
    <Modal title="Criar trilha" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            await repo.add("tracks", {
              id: uid(),
              title: String(f.get("title")),
              description: String(f.get("description")),
              category: String(f.get("category")),
              skills: String(f.get("skills"))
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
              duration_hours: Number(f.get("hours")),
              owner_id: auth.id!,
              organization_id: auth.organizationId,
              published: true,
            });
            onClose();
          });
        }}
      >
        <label>
          Título
          <input name="title" required maxLength={120} />
        </label>
        <label>
          Descrição
          <textarea name="description" required maxLength={2000} />
        </label>
        <label>
          Categoria
          <input name="category" required maxLength={50} />
        </label>
        <label>
          Competências (separadas por vírgula)
          <input name="skills" maxLength={300} />
        </label>
        <label>
          Carga horária
          <input name="hours" type="number" min={1} max={2000} required />
        </label>
        <Button type="submit" disabled={action.busy}>
          Criar trilha
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
function ModuleEditor({
  trackId,
  onClose,
}: {
  trackId: string;
  onClose: () => void;
}) {
  const repo = useData(),
    action = useAction(),
    previous = repo.data.modules
      .filter((m) => m.track_id === trackId)
      .sort((a, b) => a.position - b.position);
  return (
    <Modal title="Adicionar módulo" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            await repo.add("modules", {
              id: uid(),
              track_id: trackId,
              title: String(f.get("title")),
              body: String(f.get("body")),
              position: previous.length,
              prerequisite_id: String(f.get("prerequisite")) || null,
              xp: Number(f.get("xp")),
            });
            onClose();
          });
        }}
      >
        <label>
          Título
          <input name="title" maxLength={120} required />
        </label>
        <label>
          Conteúdo
          <textarea
            name="body"
            rows={10}
            minLength={30}
            maxLength={30000}
            required
          />
        </label>
        <label>
          Pré-requisito
          <select name="prerequisite" defaultValue={previous.at(-1)?.id || ""}>
            <option value="">Sem pré-requisito</option>
            {previous.map((m) => (
              <option value={m.id} key={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          XP
          <input
            type="number"
            name="xp"
            defaultValue={100}
            min={0}
            max={1000}
            required
          />
        </label>
        <Button type="submit" disabled={action.busy}>
          Publicar módulo
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
