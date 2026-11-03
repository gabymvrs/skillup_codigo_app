import { useEffect, useRef, useState } from "react";
import {
  guidedTheories,
  traceAverage,
  algorithmOrder,
  type LearningInputs,
} from "../lib/guidedLearning";
import { Button, Notice, ProgressBar } from "./ui";
import { TeachingCode } from "./TeachingCode";
import { LearningResources } from "./LearningResources";
import { LogicExperiment } from "./LogicExperiment";
import { isLogicKind } from "../lib/logicLearning";
export function AverageExperiment({
  value,
  onChange,
  mission = false,
  disabled = false,
}: {
  value: LearningInputs;
  onChange: (value: LearningInputs) => void;
  mission?: boolean;
  disabled?: boolean;
}) {
  const [result, setResult] = useState<ReturnType<typeof traceAverage> | null>(
    null,
  );
  const order = value.order || [...algorithmOrder].reverse();
  const labels: Record<string, string> = {
    read: "Ler e validar as notas",
    sum: "Somar as duas notas",
    mean: "Dividir a soma por 2",
    show: "Mostrar a média",
  };
  const change = (patch: Partial<LearningInputs>) => {
    setResult(null);
    onChange({ ...value, ...patch, ran: false });
  };
  return (
    <section
      className="guided-experiment stack"
      aria-label={mission ? "Missão: organize e teste" : "Simulador de média"}
    >
      {mission && (
        <>
          <h4>Organize as instruções</h4>
          <p>
            Teste a ordem inicial para observar o problema. Depois use Subir e
            Descer para corrigir as dependências entre os passos. Os botões
            também funcionam por teclado.
          </p>
          <ol>
            {order.map((step, i) => (
              <li key={step}>
                <span>{labels[step]}</span>
                <div className="actions">
                  <Button
                    variant="outline"
                    disabled={disabled || i === 0}
                    aria-label={`Subir ${labels[step]}`}
                    onClick={() => {
                      const next = [...order];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      change({ order: next });
                    }}
                  >
                    Subir
                  </Button>
                  <Button
                    variant="outline"
                    disabled={disabled || i === order.length - 1}
                    aria-label={`Descer ${labels[step]}`}
                    onClick={() => {
                      const next = [...order];
                      [next[i + 1], next[i]] = [next[i], next[i + 1]];
                      change({ order: next });
                    }}
                  >
                    Descer
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      <div className="two-columns">
        <label>
          Primeira nota
          <input
            value={value.first}
            inputMode="decimal"
            maxLength={10}
            disabled={disabled}
            onChange={(e) => change({ first: e.target.value })}
          />
        </label>
        <label>
          Segunda nota
          <input
            value={value.second}
            inputMode="decimal"
            maxLength={10}
            disabled={disabled}
            onChange={(e) => change({ second: e.target.value })}
          />
        </label>
      </div>
      <Button
        disabled={disabled}
        onClick={() => {
          const next = traceAverage(value, mission ? order : algorithmOrder);
          setResult(next);
          onChange({
            ...value,
            order: mission ? order : value.order,
            ran: !next.error,
          });
        }}
      >
        {mission ? "Testar minha sequência" : "Calcular exemplo"}
      </Button>
      <p className="small muted">
        Simulação das operações descritas nesta atividade. Não executa código de
        uma linguagem de programação.
      </p>
      {result && (
        <div aria-live="polite">
          <ol>
            {result.rows.map((row, i) => (
              <li key={i}>{row}</li>
            ))}
          </ol>
          {result.error ? (
            <Notice tone="warning">{result.error}</Notice>
          ) : (
            <Notice tone="success">
              Média calculada: {result.mean}. A regra foi preservada; o
              resultado depende das entradas.
            </Notice>
          )}
        </div>
      )}
    </section>
  );
}
export function GuidedTheory({
  moduleId,
  step,
  onStep,
  inputs,
  onInputs,
  onComplete,
  resourceIds,
  disabled,
}: {
  moduleId: string;
  step: number;
  onStep: (step: number) => void;
  inputs: LearningInputs;
  onInputs: (value: LearningInputs) => void;
  onComplete: () => void;
  resourceIds: string[];
  disabled: boolean;
}) {
  const guide = guidedTheories[moduleId],
    index = Math.min(Math.max(step, 0), guide.steps.length - 1),
    current = guide.steps[index],
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [index]);
  return (
    <section className="stack" aria-label="Teoria passo a passo">
      <p>
        <strong>Seu objetivo:</strong> {guide.objective}
      </p>
      <details>
        <summary>O que preciso saber antes?</summary>
        <p>{guide.prerequisites}</p>
      </details>
      <ProgressBar
        value={Math.round(((index + 1) / guide.steps.length) * 100)}
        label={`Teoria: passo ${index + 1} de ${guide.steps.length}`}
      />
      <h3 ref={heading} tabIndex={-1}>
        {current.title}
      </h3>
      {current.text.split("\n\n").map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {current.code && <TeachingCode source={current.code} />}
      {current.annotations && (
        <ul>
          {current.annotations.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
      {current.variables && (
        <dl className="variable-grid">
          {current.variables.map((v) => (
            <div className="card" key={v.name}>
              <dt>
                <code>{v.name}</code>
              </dt>
              <dd>{v.value}</dd>
              <small>{v.type}</small>
            </div>
          ))}
        </dl>
      )}
      {current.trace && (
        <ol className="execution-trace" aria-label="Passos da execução">
          {current.trace.map((row, i) => (
            <li key={i}>{row}</li>
          ))}
        </ol>
      )}
      {current.experiment === "average" && (
        <AverageExperiment
          value={inputs}
          onChange={onInputs}
          disabled={disabled}
        />
      )}
      {current.experiment && isLogicKind(current.experiment) && (
        <LogicExperiment
          kind={current.experiment}
          value={inputs}
          onChange={onInputs}
          disabled={disabled}
        />
      )}
      {index === guide.steps.length - 1 && (
        <>
          <p>{guide.next}</p>
          <LearningResources ids={resourceIds} />
        </>
      )}
      <div className="actions">
        <Button
          variant="outline"
          disabled={disabled || index === 0}
          onClick={() => onStep(index - 1)}
        >
          Voltar na teoria
        </Button>
        {index < guide.steps.length - 1 ? (
          <Button disabled={disabled} onClick={() => onStep(index + 1)}>
            Continuar teoria
          </Button>
        ) : (
          <Button disabled={disabled} onClick={onComplete}>
            Continuar para a prática
          </Button>
        )}
      </div>
    </section>
  );
}
