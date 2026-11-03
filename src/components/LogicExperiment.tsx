import type { LearningInputs } from "../lib/guidedLearning";
import {
  approvalResult,
  compareNumbers,
  numericInput,
  truthRows,
  type LogicKind,
} from "../lib/logicLearning";
import { Button, Notice } from "./ui";
export function TruthIndicator({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
  return (
    <div className={`truth-indicator ${value ? "truth-yes" : "truth-no"}`}>
      <span>{label}</span>
      <strong>{value ? "Verdadeiro (true)" : "Falso (false)"}</strong>
    </div>
  );
}
export function LogicExperiment({
  kind,
  value,
  onChange,
  mission = false,
  disabled = false,
}: {
  kind: LogicKind;
  value: LearningInputs;
  onChange: (value: LearningInputs) => void;
  mission?: boolean;
  disabled?: boolean;
}) {
  const change = (patch: Partial<LearningInputs>) =>
    onChange({ ...value, ...patch, ran: false });
  const a = value.first === "true",
    b = value.second === "true",
    c = value.third === "true";
  const approval = approvalResult(value),
    first = numericInput(value.first, 100),
    second = numericInput(value.second, 100);
  const op = ["==", "!=", ">", "<", ">=", "<="].includes(value.operator || "")
    ? value.operator!
    : ">=";
  const numeric = kind === "approval" || kind === "comparison";
  const valid =
    kind === "approval"
      ? approval !== null
      : kind === "comparison"
        ? first !== null && second !== null
        : true;
  const labels =
    kind === "condition"
      ? ["A luz está acesa"]
      : kind === "not"
        ? ["A porta está aberta"]
        : kind === "or"
          ? ["Tem carteira", "Tem comprovante"]
          : kind === "grouping"
            ? ["É docente", "É estudante", "Tem autorização"]
            : ["Cadastro confirmado", "Matrícula ativa"];
  const result =
    kind === "condition"
      ? a
      : kind === "not"
        ? !a
        : kind === "grouping"
          ? a || (b && c)
          : kind === "de-morgan"
            ? !(a && b)
            : kind === "truth-table"
              ? a && b
              : a || b;
  return (
    <section
      className="guided-experiment stack"
      aria-label={
        kind === "approval"
          ? "Simulador de aprovação"
          : "Laboratório de condições"
      }
    >
      {numeric ? (
        <div className="two-columns">
          <label>
            {kind === "approval" ? "Nota (0 a 10)" : "Primeiro valor (0 a 100)"}
            <input
              value={value.first}
              inputMode="decimal"
              maxLength={10}
              disabled={disabled}
              onChange={(e) => change({ first: e.target.value })}
            />
          </label>
          <label>
            {kind === "approval"
              ? "Frequência (0 a 100%)"
              : "Segundo valor (0 a 100)"}
            <input
              value={value.second}
              inputMode="decimal"
              maxLength={10}
              disabled={disabled}
              onChange={(e) => change({ second: e.target.value })}
            />
          </label>
          {kind === "comparison" && (
            <label>
              Comparação
              <select
                value={op}
                disabled={disabled}
                onChange={(e) => change({ operator: e.target.value })}
              >
                {["==", "!=", ">", "<", ">=", "<="].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      ) : (
        <fieldset>
          <legend>Altere a situação</legend>
          {labels.map((label, i) => (
            <label className="lesson-check" key={label}>
              <input
                type="checkbox"
                checked={[a, b, c][i]}
                disabled={disabled}
                onChange={(e) =>
                  change({
                    [(["first", "second", "third"] as const)[i]]: String(
                      e.target.checked,
                    ),
                  })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}
      <div className="stack" aria-live="polite">
        {!valid ? (
          <Notice tone="warning">
            {kind === "approval"
              ? "Informe nota de 0 a 10 e frequência de 0 a 100."
              : "Informe dois números de 0 a 100."}{" "}
            Campos vazios não são zero.
          </Notice>
        ) : kind === "approval" && approval ? (
          <>
            <TruthIndicator
              label={`${value.first} >= 7 · requisito da nota`}
              value={approval.grade}
            />
            <TruthIndicator
              label={`${value.second} >= 75 · requisito da frequência`}
              value={approval.attendance}
            />
            <TruthIndicator
              label="nota >= 7 && frequencia >= 75"
              value={approval.approved}
            />
            <p>
              {approval.approved
                ? "As duas regras foram cumpridas. A aprovação é permitida neste exemplo."
                : `A aprovação é recusada porque ${!approval.grade && !approval.attendance ? "a nota e a frequência estão abaixo dos mínimos" : !approval.grade ? "a nota está abaixo de 7" : "a frequência está abaixo de 75%"}. O E exige os dois requisitos.`}
            </p>
            <ol className="execution-trace" aria-label="Caminho da decisão">
              <li>Receber nota e frequência</li>
              <li>Conferir cada limite</li>
              <li>Combinar com E</li>
              <li>
                {approval.approved
                  ? "Aprovação permitida"
                  : "Aprovação recusada"}
              </li>
            </ol>
          </>
        ) : kind === "comparison" ? (
          <TruthIndicator
            label={`${first} ${op} ${second}`}
            value={compareNumbers(first!, second!, op)}
          />
        ) : (
          <>
            <TruthIndicator
              label={
                kind === "condition"
                  ? "A luz está acesa"
                  : kind === "not"
                    ? "!aberta"
                    : kind === "grouping"
                      ? "docente || (estudante && autorizacao)"
                      : kind === "de-morgan"
                        ? "!(cadastrado && ativo)"
                        : kind === "truth-table"
                          ? "cadastrado && ativo"
                          : "carteira || comprovante"
              }
              value={result}
            />
            {kind === "condition" && (
              <p>
                {a
                  ? "Condição verdadeira: você pode ler com a luz acesa."
                  : "Condição falsa: acenda a luz antes de ler."}
              </p>
            )}
            {kind === "not" && (
              <TruthIndicator label="aberta (antes de negar)" value={a} />
            )}
            {kind === "grouping" && (
              <TruthIndicator
                label="(docente || estudante) && autorizacao"
                value={(a || b) && c}
              />
            )}
            {kind === "de-morgan" && (
              <>
                <TruthIndicator
                  label="!cadastrado || !ativo (equivalente)"
                  value={!a || !b}
                />
                <TruthIndicator
                  label="!cadastrado && !ativo (outra regra)"
                  value={!a && !b}
                />
              </>
            )}
            {(kind === "truth-table" || kind === "de-morgan") && (
              <div className="chart-table">
                <table>
                  <caption>Combinações das condições A e B</caption>
                  <thead>
                    <tr>
                      <th>A</th>
                      <th>B</th>
                      <th>{kind === "de-morgan" ? "!(A && B)" : "A && B"}</th>
                      <th>{kind === "de-morgan" ? "!A || !B" : "A || B"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {truthRows.map((r) => (
                      <tr
                        key={`${r.a}${r.b}`}
                        aria-current={
                          r.a === a && r.b === b ? "true" : undefined
                        }
                      >
                        <td>{String(r.a)}</td>
                        <td>{String(r.b)}</td>
                        <td>
                          {String(kind === "de-morgan" ? r.notAnd : r.and)}
                        </td>
                        <td>
                          {String(kind === "de-morgan" ? r.notAOrNotB : r.or)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      {mission && (
        <>
          <Button
            disabled={disabled || !valid}
            onClick={() =>
              onChange({
                ...value,
                ...(!numeric
                  ? { first: String(a), second: String(b), third: String(c) }
                  : {}),
                ran: true,
              })
            }
          >
            Testar simulação
          </Button>
          {value.ran && (
            <p role="status">
              Simulação registrada. Explique o resultado na sua entrega.
            </p>
          )}
        </>
      )}
    </section>
  );
}
