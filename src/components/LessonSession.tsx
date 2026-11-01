import { useEffect, useRef, useState } from "react";
import type { Module, ExerciseAnswer } from "../lib/types";
import type { LessonPlan, LessonState } from "../lib/lessonTypes";
import { lessonAction, answerLesson } from "../services/lessonJourney";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { ActivityRenderer } from "./ActivityRenderer";
import { initialAnswer, answerReady } from "./ExerciseFields";
import { LearningResources } from "./LearningResources";
import {
  ActionFeedback,
  Badge,
  Button,
  Modal,
  Notice,
  ProgressBar,
  useAction,
} from "./ui";
export function LessonSession({
  module,
  onClose,
}: {
  module: Module;
  onClose: () => void;
}) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction();
  const [state, setState] = useState<{
      plan: LessonPlan;
      session: LessonState;
    } | null>(null),
    [loading, setLoading] = useState(true),
    [index, setIndex] = useState(0),
    [answers, setAnswers] = useState<Record<string, ExerciseAnswer>>({}),
    [text, setText] = useState(""),
    [checks, setChecks] = useState<boolean[]>([]),
    [draftError, setDraftError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const draftKey = `skillup.lesson.draft.${auth.demo ? "demo" : "real"}.${auth.id}.${module.id}`;
  const stage = state?.session.stage;
  useEffect(() => {
    let active = true;
    void action
      .run(async () => {
        const next = await lessonAction(auth.demo, auth.id!, module.id, "get");
        if (!active) return;
        setState(next);
        try {
          const d = JSON.parse(sessionStorage.getItem(draftKey) || "null");
          if (d) {
            setAnswers(d.answers || {});
            setText(d.text || "");
            setChecks(d.checks || []);
          } else if (next.session.dynamic_response) {
            setText(next.session.dynamic_response.text);
            setChecks(next.session.dynamic_response.checks);
          }
        } catch {
          setDraftError(
            "Não foi possível recuperar o rascunho neste navegador.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [module.id, auth.id, auth.demo, draftKey]);
  useEffect(() => {
    if (loading) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({ answers, text, checks }),
      );
    } catch {
      setDraftError(
        "O navegador não permitiu guardar o rascunho. Mantenha esta atividade aberta até concluir.",
      );
    }
  }, [answers, text, checks, loading, draftKey]);
  useEffect(() => {
    heading.current?.focus();
  }, [stage, index]);
  async function advance(actionName: string, payload: unknown = null) {
    setState(
      await lessonAction(auth.demo, auth.id!, module.id, actionName, payload),
    );
    if (actionName === "finish") await repo.reload();
  }
  const qid = state?.plan.question_ids[index],
    q = repo.data.questions.find((q) => q.id === qid),
    result = qid ? state?.session.results[qid] : undefined;
  const first = Object.values(state?.session.results || {}),
    right = first.filter((r) => r.firstCorrect).length;
  return (
    <Modal
      title={module.title}
      onClose={() => {
        if (!action.busy) onClose();
      }}
      fullScreen
      className="lesson-session"
    >
      <div className="stack">
        {loading ? (
          <p role="status">Abrindo atividade…</p>
        ) : (
          state && (
            <>
              <div className="lesson-steps" aria-label="Partes da atividade">
                {["Teoria", "Prática", "Dinâmica"].map((label, i) => (
                  <span
                    key={label}
                    aria-current={
                      ["theory", "practice", "dynamic"][i] === stage
                        ? "step"
                        : undefined
                    }
                  >
                    {i + 1}/3 · {label}
                  </span>
                ))}
              </div>
              <ProgressBar
                value={
                  stage === "completed"
                    ? 100
                    : stage === "dynamic"
                      ? 67
                      : stage === "practice"
                        ? 33
                        : 0
                }
                label="Progresso desta atividade"
              />
              <Badge>Nível {state.plan.level}</Badge>
              {stage === "theory" && (
                <>
                  <h3 ref={heading} tabIndex={-1}>
                    1/3 · Entenda o conceito
                  </h3>
                  <article className="reading-content">
                    {module.body.split("\n\n").map((p, i) => (
                      <p key={i} className="pre-wrap">
                        {p}
                      </p>
                    ))}
                  </article>
                  <LearningResources ids={state.plan.resource_ids} />
                  <Button
                    disabled={action.busy}
                    onClick={() => action.run(() => advance("theory"))}
                  >
                    Continuar para a prática
                  </Button>
                </>
              )}
              {stage === "practice" && (
                <>
                  <h3 ref={heading} tabIndex={-1}>
                    2/3 · Pratique · Questão {index + 1} de{" "}
                    {state.plan.question_ids.length}
                  </h3>
                  {q ? (
                    <>
                      <h4>{q.title}</h4>
                      <p className="pre-wrap">{q.prompt}</p>
                      <ActivityRenderer
                        q={q}
                        value={answers[q.id] ?? initialAnswer(q)}
                        onChange={(v) =>
                          setAnswers((a) => ({ ...a, [q.id]: v }))
                        }
                        disabled={action.busy || !!result?.correct}
                      />
                      {result && (
                        <Notice tone={result.correct ? "success" : "warning"}>
                          {result.correct
                            ? "Resposta correta."
                            : "Vamos revisar e tentar novamente."}{" "}
                          {result.explanation}
                        </Notice>
                      )}
                      {!result?.correct && (
                        <Button
                          disabled={
                            action.busy ||
                            !answerReady(q, answers[q.id] ?? initialAnswer(q))
                          }
                          onClick={() =>
                            action.run(async () => {
                              setState(
                                await answerLesson(
                                  auth.demo,
                                  auth.id!,
                                  module.id,
                                  q.id,
                                  answers[q.id] ?? initialAnswer(q),
                                ),
                              );
                              await repo.reload();
                            })
                          }
                        >
                          Conferir resposta
                        </Button>
                      )}
                    </>
                  ) : (
                    <Notice tone="warning">
                      Este exercício está indisponível. Reabra a atividade após
                      atualizar os dados.
                    </Notice>
                  )}
                  <div className="actions">
                    <Button
                      variant="outline"
                      disabled={index === 0 || action.busy}
                      onClick={() => setIndex((i) => i - 1)}
                    >
                      Anterior
                    </Button>
                    {index < state.plan.question_ids.length - 1 ? (
                      <Button
                        disabled={!result?.correct || action.busy}
                        onClick={() => setIndex((i) => i + 1)}
                      >
                        Próxima questão
                      </Button>
                    ) : (
                      <Button
                        disabled={
                          action.busy ||
                          !state.plan.question_ids.every(
                            (id) => state.session.results[id]?.correct,
                          )
                        }
                        onClick={() => action.run(() => advance("practice"))}
                      >
                        Continuar para a dinâmica
                      </Button>
                    )}
                  </div>
                </>
              )}
              {stage === "dynamic" && (
                <>
                  <h3 ref={heading} tabIndex={-1}>
                    3/3 · {state.plan.dynamic.title}
                  </h3>
                  <p>{state.plan.dynamic.prompt}</p>
                  {state.plan.dynamic.kind === "podcast" &&
                    state.plan.dynamic.transcript && (
                      <details>
                        <summary>Ler transcrição</summary>
                        <p>{state.plan.dynamic.transcript}</p>
                      </details>
                    )}
                  <Notice>
                    Avaliação reflexiva: registre sua aplicação e confira os
                    critérios. Essa autoavaliação não substitui uma avaliação
                    docente.
                  </Notice>
                  <label>
                    Sua entrega
                    <textarea
                      value={text}
                      minLength={state.plan.dynamic.minLength}
                      maxLength={8000}
                      rows={7}
                      onChange={(e) => setText(e.target.value)}
                      disabled={action.busy}
                    />
                  </label>
                  <small>
                    {text.trim().length} / mínimo de{" "}
                    {state.plan.dynamic.minLength} caracteres
                  </small>
                  <fieldset>
                    <legend>Revise sua entrega</legend>
                    {state.plan.dynamic.criteria.map((c, i) => (
                      <label className="lesson-check" key={c}>
                        <input
                          type="checkbox"
                          checked={!!checks[i]}
                          disabled={action.busy}
                          onChange={(e) =>
                            setChecks((old) =>
                              state.plan.dynamic.criteria.map((_, j) =>
                                j === i ? e.target.checked : !!old[j],
                              ),
                            )
                          }
                        />
                        {c}
                      </label>
                    ))}
                  </fieldset>
                  <Button
                    disabled={
                      action.busy ||
                      text.trim().length < state.plan.dynamic.minLength ||
                      !state.plan.dynamic.criteria.every((_, i) => checks[i])
                    }
                    onClick={() =>
                      action.run(() => advance("finish", { text, checks }))
                    }
                  >
                    {action.busy ? "Registrando…" : "Finalizar atividade"}
                  </Button>
                </>
              )}
              {stage === "completed" && (
                <>
                  <h3 ref={heading} tabIndex={-1}>
                    Atividade concluída!
                  </h3>
                  <Notice tone="success">
                    Teoria, prática e dinâmica concluídas. {state.session.xp} XP
                    pela atividade
                    {state.session.xp === 0
                      ? " (já registrada anteriormente)"
                      : ""}
                    .
                  </Notice>
                  <p>
                    {right} de {state.plan.question_ids.length} acertos na
                    primeira tentativa · {first.length - right} questão(ões)
                    para reforçar.
                  </p>
                  <p>
                    {right === state.plan.question_ids.length
                      ? "Boa compreensão dos exercícios. Agora experimente aplicar o conceito em outro contexto."
                      : "Você corrigiu as respostas durante a prática. Releia a teoria dos itens abaixo e tente explicar a solução com suas palavras."}
                  </p>
                  {state.plan.question_ids.map((id, i) => {
                    const r = state.session.results[id];
                    return (
                      <details key={id}>
                        <summary>
                          {i + 1}.{" "}
                          {repo.data.questions.find((q) => q.id === id)?.title}{" "}
                          —{" "}
                          {r?.firstCorrect ? "Acertou de primeira" : "Revisar"}{" "}
                          · {r?.tries || 0} tentativa(s)
                        </summary>
                        <p>{r?.explanation}</p>
                      </details>
                    );
                  })}
                  <p>Dinâmica registrada por autoavaliação.</p>
                  <LearningResources ids={state.plan.resource_ids} />
                  <Button onClick={onClose}>Voltar à trilha</Button>
                </>
              )}
            </>
          )
        )}
        {draftError && <Notice tone="warning">{draftError}</Notice>}
        <ActionFeedback action={action} />
        {!loading && !state && (
          <Button
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                setState(
                  await lessonAction(auth.demo, auth.id!, module.id, "get"),
                );
              })
            }
          >
            Tentar abrir novamente
          </Button>
        )}
      </div>
    </Modal>
  );
}
