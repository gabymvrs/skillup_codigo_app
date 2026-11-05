import {
  activityType,
  activityKind,
  numericAnswer,
} from "../services/activities";
import type { ExerciseAnswer, Question } from "../lib/types";
import { Button, Notice } from "./ui";
export function initialAnswer(q: Question): ExerciseAnswer {
  q = { ...q, kind: activityKind(q) };
  if (activityType(q) === "code_practice") return q.payload?.starter || "";
  if (activityType(q) === "calculation" || q.kind === "blank") return "";
  if (q.kind === "challenge")
    return { text: "", checks: (q.payload?.criteria || []).map(() => false) };
  if (q.kind === "matching" || q.kind === "true_false") return [];
  if (q.kind === "ordering") return q.options.map((_, i) => i).reverse();
  return -1;
}
export function answerReady(q: Question, a: ExerciseAnswer) {
  q = { ...q, kind: activityKind(q) };
  if (activityType(q) === "calculation")
    return typeof a === "string" && Number.isFinite(numericAnswer(a));
  if (activityType(q) === "code_practice")
    return typeof a === "string" && a.trim().length > 0 && a.length <= 10000;
  if (q.kind === "blank") return typeof a === "string" && !!a.trim();
  if (q.kind === "challenge")
    return (
      typeof a === "object" &&
      !Array.isArray(a) &&
      a.text.trim().length >= (q.payload?.minLength || 120) &&
      a.checks.every(Boolean)
    );
  if (q.kind === "true_false")
    return (
      Array.isArray(a) &&
      a.length === q.options.length &&
      Array.from(a as (number | boolean)[]).every((x) => typeof x === "boolean")
    );
  if (q.kind === "matching")
    return (
      Array.isArray(a) &&
      a.length === (q.payload?.labels || []).length &&
      Array.from(a as (number | boolean)[]).every(
        (x) => typeof x === "number" && x >= 0,
      ) &&
      new Set(a as (number | boolean)[]).size === a.length
    );
  if (q.kind === "ordering")
    return Array.isArray(a) && a.length === q.options.length;
  return typeof a === "number" && a >= 0;
}
export function ExerciseFields({
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
  if (q.kind === "blank")
    return (
      <label>
        Complete a lacuna
        <input
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200}
          required
          disabled={disabled}
        />
        <small>
          Maiúsculas e espaços nas pontas são ignorados; respeite a acentuação.
        </small>
      </label>
    );
  if (q.kind === "true_false")
    return (
      <div className="stack">
        {q.options.map((text, i) => (
          <fieldset key={i}>
            <legend>{text}</legend>
            {[true, false].map((v) => (
              <label className="answer-option" key={String(v)}>
                <input
                  type="radio"
                  name={`statement-${q.id}-${i}`}
                  checked={(value as boolean[])[i] === v}
                  disabled={disabled}
                  required
                  onChange={() => {
                    const next = [...(value as boolean[])];
                    next[i] = v;
                    onChange(next);
                  }}
                />
                {v ? "Verdadeiro" : "Falso"}
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    );
  if (q.kind === "matching")
    return (
      <div className="stack">
        {q.payload?.labels?.map((text, i) => (
          <label key={text}>
            {text}
            <select
              disabled={disabled}
              value={(value as number[])[i] ?? -1}
              required
              onChange={(e) => {
                const next = [...(value as number[])];
                next[i] = Number(e.target.value);
                onChange(next);
              }}
            >
              <option value={-1} disabled>
                Escolha a definição
              </option>
              {q.options
                .map((_, j) => q.options.length - 1 - j)
                .map((j) => (
                  <option key={j} value={j}>
                    {q.options[j]}
                  </option>
                ))}
            </select>
          </label>
        ))}
        <small>Use cada definição uma vez.</small>
      </div>
    );
  if (q.kind === "ordering") {
    const order = value as number[];
    function move(i: number, delta: number) {
      const next = [...order];
      [next[i], next[i + delta]] = [next[i + delta], next[i]];
      onChange(next);
    }
    return (
      <>
        <p className="small">
          Use os botões para ordenar. Funciona também com teclado.
        </p>
        <ol className="ordering-list">
          {order.map((index, i) => (
            <li key={index}>
              <span>{q.options[index]}</span>
              <div className="actions">
                <Button
                  variant="ghost"
                  aria-label={`Subir ${q.options[index]}`}
                  disabled={disabled || i === 0}
                  onClick={() => move(i, -1)}
                >
                  Subir
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`Descer ${q.options[index]}`}
                  disabled={disabled || i === order.length - 1}
                  onClick={() => move(i, 1)}
                >
                  Descer
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </>
    );
  }
  if (q.kind === "challenge") {
    const a = value as { text: string; checks: boolean[] };
    return (
      <>
        <Notice>
          Desafio autodeclarado · {q.xp} XP uma única vez. O sistema verifica o
          preenchimento; a qualidade técnica depende de revisão docente.
        </Notice>
        <label>
          Relato do desafio
          <textarea
            rows={6}
            minLength={q.payload?.minLength || 120}
            maxLength={8000}
            value={a.text}
            required
            disabled={disabled}
            onChange={(e) => onChange({ ...a, text: e.target.value })}
          />
          <small>
            {a.text.trim().length} / {q.payload?.minLength || 120} caracteres
            mínimos
          </small>
        </label>
        <fieldset>
          <legend>Critérios de conclusão</legend>
          {q.payload?.criteria?.map((c, i) => (
            <label className="check-label" key={c}>
              <input
                type="checkbox"
                checked={a.checks[i]}
                required
                disabled={disabled}
                onChange={(e) => {
                  const checks = [...a.checks];
                  checks[i] = e.target.checked;
                  onChange({ ...a, checks });
                }}
              />
              {c}
            </label>
          ))}
        </fieldset>
      </>
    );
  }
  return (
    <fieldset>
      <legend>Escolha uma alternativa</legend>
      {q.options.map((option, i) => (
        <label className="answer-option" key={i}>
          <input
            type="radio"
            name={`answer-${q.id}`}
            checked={value === i}
            onChange={() => onChange(i)}
            disabled={disabled}
            required
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}
