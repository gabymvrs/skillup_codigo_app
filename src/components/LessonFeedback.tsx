import { useState } from "react";
import type { Module, Question, ExerciseAnswer } from "../lib/types";
import type { LessonPlan, LessonState } from "../lib/lessonTypes";
import { Button, Notice } from "./ui";
import { LearningResources } from "./LearningResources";
export function performanceLabel(score: number) {
  return score >= 90
    ? "Excelente desempenho"
    : score >= 70
      ? "Muito bom"
      : score >= 50
        ? "Bom começo, com pontos a melhorar"
        : "Revisão recomendada";
}
export function formatLessonAnswer(
  q: Question | undefined,
  value: unknown,
): string {
  if (value === undefined || value === null)
    return "Não disponível para esta tentativa anterior.";
  if (
    q?.activity_type === "calculation" &&
    typeof value === "object" &&
    "value" in value
  )
    return String(value.value);
  if (q?.kind === "challenge" && typeof value === "object" && "text" in value)
    return String(value.text);
  if (Array.isArray(value))
    return value
      .map((v, i) =>
        typeof v === "boolean"
          ? `${i + 1}: ${v ? "Verdadeiro" : "Falso"}`
          : q?.options[v] || String(v),
      )
      .join(" → ");
  if (typeof value === "number" && q?.options.length)
    return q.options[value] || String(value);
  return String(value);
}
export function LessonFeedback({
  module,
  plan,
  session,
  questions,
  onClose,
}: {
  module: Module;
  plan: LessonPlan;
  session: LessonState;
  questions: Question[];
  onClose: () => void;
}) {
  const [errorsOnly, setErrorsOnly] = useState(false),
    [theory, setTheory] = useState(false);
  const evaluated = plan.question_ids.filter(
    (id) =>
      session.results[id] &&
      session.results[id].objective !== false &&
      questions.find((q) => q.id === id)?.kind !== "challenge",
  );
  const correct = evaluated.filter((id) => session.results[id].firstCorrect),
    wrong = evaluated.filter((id) => !session.results[id].firstCorrect),
    score = evaluated.length
      ? Math.round((correct.length / evaluated.length) * 100)
      : null;
  return (
    <div className="stack">
      <h3>Atividade concluída!</h3>
      <Notice tone="success">
        Teoria, prática e dinâmica concluídas. {session.xp} XP pela atividade
        {session.xp === 0 ? " (já registrada anteriormente)" : ""}.
      </Notice>
      <p>
        {score === null
          ? "Sem questões com correção objetiva nesta atividade."
          : `${performanceLabel(score)} · ${score}% de aproveitamento`}
      </p>
      <p>
        {evaluated.length} questões avaliadas · {correct.length} acertos ·{" "}
        {wrong.length} erros na primeira tentativa.
      </p>
      <p>
        Respostas abertas e a conclusão da dinâmica são registradas
        separadamente e não entram nessa porcentagem.
      </p>
      {correct.length > 0 && (
        <p>
          <strong>Pontos fortes:</strong>{" "}
          {correct
            .map((id) => questions.find((q) => q.id === id)?.title)
            .join("; ")}
          .
        </p>
      )}
      {wrong.length > 0 && (
        <p>
          <strong>Para melhorar:</strong> revise{" "}
          {wrong
            .map((id) => questions.find((q) => q.id === id)?.title)
            .join("; ")}
          . Compare a sua primeira resposta com a esperada e refaça o raciocínio
          antes de consultar a solução.
        </p>
      )}
      <div className="actions">
        <Button variant="outline" onClick={() => setErrorsOnly((v) => !v)}>
          {errorsOnly ? "Mostrar todas as questões" : "Revisar meus erros"}
        </Button>
        <Button variant="outline" onClick={() => setTheory((v) => !v)}>
          Estudar esse assunto
        </Button>
      </div>
      {theory && (
        <article className="reading-content">
          <h4>Revisão da teoria</h4>
          {module.body.split("\n\n").map((p, i) => (
            <p key={i} className="pre-wrap">
              {p}
            </p>
          ))}
        </article>
      )}
      {errorsOnly && !wrong.length && (
        <p>Nenhum erro objetivo na primeira tentativa.</p>
      )}
      {plan.question_ids
        .filter((id) => !errorsOnly || wrong.includes(id))
        .map((id) => {
          const r = session.results[id],
            q = questions.find((q) => q.id === id);
          return (
            <details key={id} open={errorsOnly}>
              <summary>
                {q?.title} —{" "}
                {r?.objective === false || q?.kind === "challenge"
                  ? "Resposta aberta"
                  : r?.firstCorrect
                    ? "Acertou de primeira"
                    : "Revisar"}{" "}
                · {r?.tries || 0} tentativa(s)
              </summary>
              <p>
                <strong>Sua primeira resposta: </strong>
                {formatLessonAnswer(q, r?.firstResponse)}
              </p>
              <p>
                <strong>Sua última resposta: </strong>
                {formatLessonAnswer(q, r?.response)}
              </p>
              <p>
                <strong>Resposta esperada: </strong>
                {q?.activity_type === "code_practice"
                  ? "Programa que satisfaça os testes e os critérios descritos na atividade."
                  : q?.kind === "challenge"
                    ? "Produção aberta conforme os critérios; sem gabarito único."
                    : formatLessonAnswer(q, r?.expected)}
              </p>
              <p>{r?.explanation}</p>
            </details>
          );
        })}
      <h4>Resultado da dinâmica</h4>
      <p>Conclusão registrada por autoavaliação dos critérios.</p>
      {session.dynamic_response && (
        <details>
          <summary>Consultar minha entrega e os critérios</summary>
          <p className="pre-wrap">{session.dynamic_response.text}</p>
          <ul>
            {plan.dynamic.criteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
      )}
      <LearningResources ids={plan.resource_ids} />
      <Button onClick={onClose}>Continuar trilha</Button>
    </div>
  );
}
