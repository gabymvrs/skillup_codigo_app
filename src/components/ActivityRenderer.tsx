import { lazy, Suspense, useId } from "react";
import type { ExerciseAnswer, Question } from "../lib/types";
import { activityType, activityKind } from "../services/activities";
import { ExerciseFields } from "./ExerciseFields";
import { Notice } from "./ui";
const CodePractice = lazy(() => import("./CodePractice"));
export function ActivityRenderer({
  q,
  value,
  onChange,
  disabled,
}: {
  q: Question;
  value: ExerciseAnswer;
  onChange: (a: ExerciseAnswer) => void;
  disabled: boolean;
}) {
  const type = activityType(q);
  const hintId = useId();
  if (type === "code_practice")
    return (
      <Suspense fallback={<p role="status">Carregando editor…</p>}>
        <CodePractice
          q={q}
          value={String(value)}
          onChange={onChange}
          disabled={disabled}
        />
      </Suspense>
    );
  if (type === "calculation")
    return (
      <>
        <label>
          Resultado {q.payload?.unit && `(${q.payload.unit})`}
          <input
            aria-describedby={hintId}
            inputMode="decimal"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            maxLength={80}
          />
        </label>
        <small id={hintId}>
          Digite o número, usando ponto ou vírgula para decimais.
        </small>
      </>
    );
  return (
    <>
      {type === "image_identification" && q.payload?.image && (
        <figure className="activity-figure">
          <img
            src={q.payload.image}
            alt={q.payload.imageAlt || "Ilustração da atividade"}
          />
          <figcaption>{q.payload.imageAlt}</figcaption>
        </figure>
      )}
      {type === "case_study" && q.kind !== "challenge" && (
        <Notice>Analise o contexto e escolha a decisão mais adequada.</Notice>
      )}
      <ExerciseFields
        q={{ ...q, kind: activityKind(q) }}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </>
  );
}
