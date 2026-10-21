import {
  ExerciseFields,
  initialAnswer,
  answerReady,
} from "../components/ExerciseFields";
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
    xp = attempts.reduce((sum, a) => sum + a.xp, 0),
    [type, setType] = useState(""),
    [subject, setSubject] = useState(""),
    [format, setFormat] = useState(""),
    [open, setOpen] = useState<string | null>(null);
  return (
    <div className="stack">
      <Heading
        title="Prática"
        description="Transforme o conteúdo em conhecimento com exercícios curtos."
      />
      <div className="practice-stats">
        <span>
          {new Set(attempts.map((a) => a.question_id)).size} questões
          respondidas · {attempts.length} tentativa(s)
        </span>
        <span>
          {attempts.filter((a) => a.correct).length} acertos ·{" "}
          {attempts.filter((a) => !a.correct).length} erros ·{" "}
          {percent(attempts.filter((a) => a.correct).length, attempts.length)}%
          nas tentativas
        </span>
        <strong>{xp} XP em prática</strong>
      </div>
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
          ["Laboratório", "cpu"],
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
          <h2>Refatoração de Algoritmo de Busca</h2>
          <p>Até 150 XP · 15 min</p>
          <Button variant="outline" onClick={() => setType("Laboratório")}>
            Iniciar
          </Button>
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
          {type === "Laboratório" && <SearchLab />}
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
      {open && (
        <QuestionDialog questionId={open} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
export function QuestionDialog({
  questionId,
  onClose,
}: {
  questionId: string;
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
    <Modal title={q.title} onClose={onClose}>
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
        <p>{q.prompt}</p>
        <ExerciseFields
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
            Conferir resposta
          </Button>
        )}
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
export function SearchLab() {
  const [list, setList] = useState("12, 7, 25, 3, 18"),
    [target, setTarget] = useState("3"),
    [result, setResult] = useState("");
  return (
    <Card>
      <h3>Laboratório: busca linear</h3>
      <p>
        Altere a lista e observe quantas comparações são necessárias. Compare a
        busca por um item no início, no fim e ausente.
      </p>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const values = list.split(",").map((x) => Number(x.trim()));
          if (
            values.length > 100 ||
            values.some((n) => !Number.isFinite(n)) ||
            !Number.isFinite(Number(target))
          ) {
            setResult("Use até 100 números válidos separados por vírgula.");
            return;
          }
          const i = values.indexOf(Number(target));
          setResult(
            i === -1
              ? `Não encontrado. Foram necessárias ${values.length} comparações.`
              : `Encontrado no índice ${i} após ${i + 1} comparação(ões).`,
          );
        }}
      >
        <label>
          Lista de números
          <input
            value={list}
            onChange={(e) => setList(e.target.value)}
            maxLength={500}
          />
        </label>
        <label>
          Valor procurado
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </label>
        <Button type="submit" variant="outline" icon="play">
          Executar simulação
        </Button>
        {result && <Notice>{result}</Notice>}
      </form>
    </Card>
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
