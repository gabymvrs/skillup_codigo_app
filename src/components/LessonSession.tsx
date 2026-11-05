import { GuidedTheory, AverageExperiment } from "./GuidedTheory";
import { LogicExperiment } from "./LogicExperiment";
import curriculum from "../data/beginner-curriculum.json";
import { isLogicKind, logicMissionReady } from "../lib/logicLearning";
import {
  guidedTheories,
  missionReady,
  type LearningInputs,
} from "../lib/guidedLearning";
import { LessonFeedback } from "./LessonFeedback";
import { useEffect, useRef, useState } from "react";
import type { Module, ExerciseAnswer } from "../lib/types";
import type { LessonPlan, LessonState } from "../lib/lessonTypes";
import {
  lessonAction,
  answerLesson,
  saveLessonDraft,
} from "../services/lessonJourney";
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
    [view, setView] = useState(""),
    [theoryStep, setTheoryStep] = useState(0),
    [theoryInputs, setTheoryInputs] = useState<LearningInputs>({
      first: "6",
      second: "8",
    }),
    [interaction, setInteraction] = useState<LearningInputs>({
      first: "4",
      second: "10",
      order: ["show", "mean", "sum", "read"],
    }),
    [draftError, setDraftError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const draftKey = `skillup.lesson.draft.${auth.demo ? "demo" : "real"}.${auth.id}.${module.id}`;
  const stage = state?.session.stage;
  const currentView = view || stage;
  const practiceReady =
    !!state &&
    state.plan.question_ids.every((id) => state.session.results[id]?.correct);
  useEffect(() => {
    let active = true;
    void action
      .run(async () => {
        const next = await lessonAction(auth.demo, auth.id!, module.id, "get");
        if (!active) return;
        setState(next);
        try {
          const d = JSON.parse(localStorage.getItem(draftKey) || "null");
          const saved = next.session.draft;
          const chosen =
            saved && (!d || (saved.savedAt || 0) > (d.savedAt || 0))
              ? saved
              : d;
          if (chosen) {
            const d = chosen;
            if (
              ["theory", "practice", "dynamic", "completed"].includes(d.view) &&
              (d.view !== "completed" || next.session.stage === "completed")
            )
              setView(d.view);
            setTheoryStep(d.theoryStep || 0);
            if (d.theoryInputs) setTheoryInputs(d.theoryInputs);
            if (d.interaction) setInteraction(d.interaction);
            setIndex(
              Math.min(
                Math.max(d.index || 0, 0),
                next.plan.question_ids.length - 1,
              ),
            );
            setAnswers({
              ...d.answers,
              ...Object.fromEntries(
                Object.entries(next.session.results)
                  .filter(([, r]) => r.correct && r.response !== undefined)
                  .map(([id, r]) => [id, r.response!]),
              ),
            });
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
    if (loading || !state) return;
    const draft = {
      answers,
      text,
      checks,
      index,
      view,
      theoryStep,
      theoryInputs,
      interaction,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      setDraftError("Não foi possível guardar o rascunho neste navegador.");
    }
    const timer = setTimeout(() => {
      void saveLessonDraft(auth.demo, auth.id!, module.id, draft)
        .then(() => setDraftError(""))
        .catch(() =>
          setDraftError(
            "Rascunho salvo neste navegador. A cópia da conta será tentada após a próxima alteração.",
          ),
        );
    }, 600);
    return () => clearTimeout(timer);
  }, [
    answers,
    text,
    checks,
    index,
    view,
    theoryStep,
    theoryInputs,
    interaction,
    loading,
    draftKey,
  ]);
  useEffect(() => {
    heading.current?.focus();
  }, [currentView, index]);
  async function closeLesson() {
    if (action.busy) return;
    try {
      await saveLessonDraft(auth.demo, auth.id!, module.id, {
        answers,
        text,
        checks,
        index,
        view,
        theoryStep,
        theoryInputs,
        interaction,
        savedAt: Date.now(),
      });
    } catch {
      /* The local draft remains available. */
    }
    onClose();
  }
  async function navigate(target: string) {
    if (stage === "theory" && target !== "theory") {
      setState(
        await lessonAction(auth.demo, auth.id!, module.id, "open_practice"),
      );
    }
    setView(target);
  }
  async function advance(actionName: string, payload: unknown = null) {
    if (actionName === "finish" && stage === "practice")
      setState(await lessonAction(auth.demo, auth.id!, module.id, "practice"));
    if (actionName === "finish" && stage === "completed") {
      setView("completed");
      return;
    }
    setState(
      await lessonAction(auth.demo, auth.id!, module.id, actionName, payload),
    );
    if (actionName === "practice") setView("dynamic");
    if (actionName === "finish") setView("completed");
    if (actionName === "finish") await repo.reload();
  }
  const qid = state?.plan.question_ids[index],
    q = repo.data.questions.find((q) => q.id === qid),
    result = qid ? state?.session.results[qid] : undefined;
  return (
    <Modal
      title={module.title}
      onClose={() => {
        void closeLesson();
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
                  <button
                    type="button"
                    disabled={action.busy}
                    onClick={() =>
                      action.run(() =>
                        navigate(["theory", "practice", "dynamic"][i]),
                      )
                    }
                    key={label}
                    aria-current={
                      ["theory", "practice", "dynamic"][i] === currentView
                        ? "step"
                        : undefined
                    }
                  >
                    {i + 1}/3 · {label}
                  </button>
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
              {(curriculum.pedagogy as Record<string, { competency: string }>)[
                module.id
              ] && (
                <p className="small">
                  Competência:{" "}
                  {
                    (
                      curriculum.pedagogy as Record<
                        string,
                        { competency: string }
                      >
                    )[module.id].competency
                  }
                </p>
              )}
              {currentView === "theory" && (
                <Button
                  variant="outline"
                  disabled={action.busy}
                  onClick={() => action.run(() => navigate("practice"))}
                >
                  {stage === "theory"
                    ? "Pular teoria e ir para prática"
                    : "Ir para a prática"}
                </Button>
              )}
              {stage === "completed" && currentView !== "completed" && (
                <Button variant="outline" onClick={() => setView("completed")}>
                  Ver feedback final
                </Button>
              )}
              {currentView === "theory" && guidedTheories[module.id] ? (
                <GuidedTheory
                  moduleId={module.id}
                  step={theoryStep}
                  onStep={setTheoryStep}
                  inputs={theoryInputs}
                  onInputs={setTheoryInputs}
                  resourceIds={state.plan.resource_ids}
                  disabled={action.busy}
                  onComplete={() =>
                    action.run(async () => {
                      if (stage !== "completed")
                        setState(
                          await lessonAction(
                            auth.demo,
                            auth.id!,
                            module.id,
                            "theory",
                          ),
                        );
                      setView("practice");
                    })
                  }
                />
              ) : (
                currentView === "theory" && (
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
                      onClick={() =>
                        action.run(async () => {
                          if (stage !== "completed")
                            setState(
                              await lessonAction(
                                auth.demo,
                                auth.id!,
                                module.id,
                                "theory",
                              ),
                            );
                          setView("practice");
                        })
                      }
                    >
                      Continuar para a prática
                    </Button>
                  </>
                )
              )}
              {currentView === "practice" && (
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
                        disabled={
                          action.busy ||
                          (!!result?.correct &&
                            q.activity_type !== "code_practice")
                        }
                        codeReadOnly={!!result?.correct}
                      />
                      {result && (
                        <Notice tone={result.correct ? "success" : "warning"}>
                          {result.correct
                            ? "Resposta correta."
                            : "Vamos revisar e tentar novamente."}{" "}
                          {result.explanation}
                        </Notice>
                      )}
                      {result && !result.correct && result.tries >= 2 && (
                        <Notice>
                          Você pode revisar o conceito antes de tentar de novo.
                          Nenhum XP é descontado.
                          <Button
                            variant="outline"
                            onClick={() => {
                              setTheoryStep(0);
                              setView("theory");
                            }}
                          >
                            Rever explicação passo a passo
                          </Button>
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
                        onClick={() =>
                          action.run(async () => {
                            if (stage === "practice") await advance("practice");
                            else setView("dynamic");
                          })
                        }
                      >
                        Continuar para a dinâmica
                      </Button>
                    )}
                  </div>
                </>
              )}
              {currentView === "dynamic" && (
                <>
                  <h3 ref={heading} tabIndex={-1}>
                    3/3 · {state.plan.dynamic.title}
                  </h3>
                  <p>{state.plan.dynamic.prompt}</p>
                  {!practiceReady && (
                    <Notice tone="warning">
                      Você pode explorar a dinâmica agora. Para finalizar e
                      receber XP, confira e corrija todas as questões da
                      prática.
                    </Notice>
                  )}
                  {!state.session.theory_completed && stage !== "completed" && (
                    <Notice tone="warning">
                      Você pode estudar as partes em qualquer ordem. Antes de
                      finalizar, percorra a teoria e use “Continuar para a
                      prática” no último passo.
                    </Notice>
                  )}
                  {isLogicKind(state.plan.dynamic.kind) && (
                    <LogicExperiment
                      kind={state.plan.dynamic.kind}
                      value={interaction}
                      onChange={setInteraction}
                      mission
                      disabled={action.busy}
                    />
                  )}
                  {state.plan.dynamic.kind === "trace" && (
                    <AverageExperiment
                      value={interaction}
                      onChange={setInteraction}
                      mission
                      disabled={action.busy}
                    />
                  )}
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
                      !practiceReady ||
                      (!state.session.theory_completed &&
                        stage !== "completed") ||
                      (isLogicKind(state.plan.dynamic.kind) &&
                        !logicMissionReady(
                          state.plan.dynamic.kind,
                          interaction,
                        )) ||
                      (state.plan.dynamic.kind === "trace" &&
                        !missionReady(interaction)) ||
                      text.trim().length < state.plan.dynamic.minLength ||
                      !state.plan.dynamic.criteria.every((_, i) => checks[i])
                    }
                    onClick={() =>
                      action.run(() =>
                        advance("finish", {
                          text,
                          checks,
                          ...(state.plan.dynamic.kind === "trace" ||
                          isLogicKind(state.plan.dynamic.kind)
                            ? { interaction }
                            : {}),
                        }),
                      )
                    }
                  >
                    {action.busy ? "Registrando…" : "Finalizar atividade"}
                  </Button>
                </>
              )}
              {currentView === "completed" && (
                <LessonFeedback
                  module={module}
                  plan={state.plan}
                  session={state.session}
                  questions={repo.data.questions}
                  onClose={() => {
                    void closeLesson();
                  }}
                />
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
