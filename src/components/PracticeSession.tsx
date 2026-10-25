import { ActivityRenderer } from "./ActivityRenderer";
import { useEffect, useRef, useState } from "react";
import type { ExerciseAnswer, Question } from "../lib/types";
import { useData } from "../state/DataContext";
import { answerReady, initialAnswer } from "./ExerciseFields";
import {
  ActionFeedback,
  Button,
  Modal,
  Notice,
  ProgressBar,
  useAction,
} from "./ui";

type Result = { correct: boolean; xp: number; explanation: string };
export interface PracticeSet {
  id: string;
  title: string;
  category: string;
  questionIds: string[];
}
export function PracticeSession({
  set,
  onClose,
}: {
  set: PracticeSet;
  onClose: () => void;
}) {
  const repo = useData();
  // Snapshot the set: a background data refresh must not reorder a running exam.
  const [questions] = useState(() =>
    set.questionIds
      .map((id) => repo.data.questions.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q)),
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ExerciseAnswer>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const confirmed = useRef<Record<string, Result>>({});
  const [stage, setStage] = useState<"answer" | "review" | "result">("answer");
  const [locked, setLocked] = useState(false);
  const [closing, setClosing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const action = useAction();
  const exam = set.category === "Exames";
  const q = questions[index];
  const ready = (item: Question) =>
    answers[item.id] !== undefined && answerReady(item, answers[item.id]);
  const answered = questions.filter(ready).length;
  useEffect(() => {
    heading.current?.focus();
  }, [index, stage]);
  const complete =
    questions.length === set.questionIds.length &&
    questions.length >= (exam ? 10 : 5);
  async function submitQuestion(item: Question) {
    if (confirmed.current[item.id] || !ready(item)) return;
    const result = await repo.answer(item.id, answers[item.id]);
    confirmed.current[item.id] = result;
    setResults({ ...confirmed.current });
  }
  function finish() {
    void action.run(async () => {
      setLocked(true);
      // Keep confirmed results after a connection failure; retry only remaining answers.
      for (const item of questions) await submitQuestion(item);
      setStage("result");
    });
  }
  function requestClose() {
    if (action.busy) return;
    if (stage !== "result" && Object.keys(answers).length) setClosing(true);
    else onClose();
  }
  return (
    <Modal
      title={set.title}
      onClose={requestClose}
      className="practice-session"
    >
      {!complete ? (
        <Notice tone="warning">
          O conteúdo deste bloco ainda não foi disponibilizado por completo.
          Tente novamente mais tarde.
        </Notice>
      ) : (
        <div className="stack">
          {closing ? (
            <div className="stack">
              <h3>Sair deste bloco?</h3>
              <p>
                As respostas ainda não enviadas serão descartadas. As questões
                já corrigidas continuam no histórico.
              </p>
              <div className="actions">
                <Button variant="outline" onClick={() => setClosing(false)}>
                  Continuar respondendo
                </Button>
                <Button variant="danger" onClick={onClose}>
                  Sair do bloco
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p>
                {exam ? "Exame avançado" : "Prática guiada"} ·{" "}
                {questions.length} questões.{" "}
                {exam
                  ? "A correção aparece somente depois de finalizar."
                  : "Você pode conferir cada resposta ou corrigir tudo ao finalizar."}
              </p>
              <ProgressBar
                value={Math.round((answered / questions.length) * 100)}
                label={`${answered} de ${questions.length} respondidas`}
              />
              {stage !== "result" && (
                <nav
                  className="question-navigation"
                  aria-label="Questões do bloco"
                >
                  {questions.map((item, i) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-label={`Questão ${i + 1}: ${ready(item) ? "respondida" : "não respondida"}`}
                      aria-current={
                        stage === "answer" && index === i ? "step" : undefined
                      }
                      className={ready(item) ? "answered" : ""}
                      disabled={action.busy}
                      onClick={() => {
                        setIndex(i);
                        setStage("answer");
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              )}
              {stage === "answer" && q && (
                <>
                  <h3 ref={heading} tabIndex={-1}>
                    Questão {index + 1} de {questions.length}: {q.title}
                  </h3>
                  <p className="pre-wrap">{q.prompt}</p>
                  <ActivityRenderer
                    q={q}
                    value={answers[q.id] ?? initialAnswer(q)}
                    onChange={(value) =>
                      setAnswers((a) => ({ ...a, [q.id]: value }))
                    }
                    disabled={action.busy || locked || Boolean(results[q.id])}
                  />
                  {results[q.id] && !exam && (
                    <Notice
                      tone={results[q.id].correct ? "success" : "warning"}
                    >
                      {results[q.id].correct
                        ? "Resposta correta."
                        : "Vamos revisar."}{" "}
                      {results[q.id].explanation}
                    </Notice>
                  )}
                  <div className="actions">
                    {!exam && !results[q.id] && (
                      <Button
                        disabled={!ready(q) || action.busy || locked}
                        onClick={() => action.run(() => submitQuestion(q))}
                      >
                        Conferir questão
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      disabled={index === 0 || action.busy}
                      onClick={() => setIndex((i) => i - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      disabled={index === questions.length - 1 || action.busy}
                      onClick={() => setIndex((i) => i + 1)}
                    >
                      Próxima
                    </Button>
                    <Button
                      disabled={action.busy}
                      onClick={() => setStage("review")}
                    >
                      Revisar respostas
                    </Button>
                  </div>
                </>
              )}
              {stage !== "answer" && (
                <>
                  <h3 ref={heading} tabIndex={-1}>
                    {stage === "result"
                      ? "Resultado do bloco"
                      : "Revise antes de finalizar"}
                  </h3>
                  {stage === "review" && (
                    <p>
                      {questions.length - answered} questão(ões) sem resposta
                      completa. Você pode voltar para responder ou finalizar; as
                      não respondidas ficam sem pontuação.
                    </p>
                  )}
                  {stage === "result" && (
                    <Notice tone="success">
                      {Object.values(results).filter((r) => r.correct).length}{" "}
                      acerto(s) de {questions.length} questões ·{" "}
                      {Object.values(results).reduce((sum, r) => sum + r.xp, 0)}{" "}
                      XP nas respostas. {questions.length - answered} não
                      respondida(s).
                    </Notice>
                  )}
                  {questions.map((item, i) => (
                    <details className="review-question" key={item.id}>
                      <summary>
                        {i + 1}. {item.title} —{" "}
                        {stage === "result" && results[item.id]
                          ? results[item.id].correct
                            ? "Correta"
                            : "Incorreta"
                          : ready(item)
                            ? "Respondida"
                            : "Sem resposta completa"}
                      </summary>
                      <div className="stack">
                        <p>{item.prompt}</p>
                        <p className="small">
                          Alternativas e sua resposta marcada:
                        </p>
                        <ActivityRenderer
                          q={item}
                          value={answers[item.id] ?? initialAnswer(item)}
                          onChange={() => {}}
                          disabled
                        />
                        {stage === "result" && results[item.id] && (
                          <p>
                            <strong>Correção: </strong>
                            {results[item.id].explanation}
                          </p>
                        )}
                        {stage === "review" && (
                          <Button
                            variant="outline"
                            disabled={
                              action.busy || locked || Boolean(results[item.id])
                            }
                            onClick={() => {
                              setIndex(i);
                              setStage("answer");
                            }}
                          >
                            Editar questão {i + 1}
                          </Button>
                        )}
                      </div>
                    </details>
                  ))}
                  {stage === "review" ? (
                    <Button disabled={action.busy} onClick={finish}>
                      {action.busy
                        ? "Corrigindo respostas…"
                        : locked
                          ? "Tentar concluir novamente"
                          : "Finalizar e corrigir"}
                    </Button>
                  ) : (
                    <Button onClick={onClose}>Concluir revisão</Button>
                  )}
                </>
              )}
              {locked && stage !== "result" && !action.busy && (
                <Notice tone="warning">
                  A correção foi interrompida. Suas marcações estão preservadas
                  neste painel. Abra a revisão e tente concluir novamente.
                </Notice>
              )}
              <ActionFeedback action={action} />
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
