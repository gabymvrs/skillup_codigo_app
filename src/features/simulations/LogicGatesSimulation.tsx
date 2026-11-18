import { useMemo, useState } from "react";
import { Button, Notice } from "../../components/ui";

type GateKind = "and" | "or" | "not";

const gates: Record<
  GateKind,
  { name: string; expression: string; explanation: string }
> = {
  and: {
    name: "AND (E)",
    expression: "A AND B",
    explanation: "A saída liga somente quando as duas entradas estão ligadas.",
  },
  or: {
    name: "OR (OU)",
    expression: "A OR B",
    explanation: "A saída liga quando pelo menos uma entrada está ligada.",
  },
  not: {
    name: "NOT (NÃO)",
    expression: "NOT A",
    explanation: "A saída sempre mostra o estado contrário da entrada.",
  },
};

function gateResult(gate: GateKind, a: boolean, b: boolean) {
  if (gate === "and") return a && b;
  if (gate === "or") return a || b;
  return !a;
}

function Bit({ value }: { value: boolean }) {
  return (
    <span className={`logic-bit ${value ? "on" : "off"}`}>{Number(value)}</span>
  );
}

function GateDiagram({
  gate,
  a,
  b,
  output,
}: {
  gate: GateKind;
  a: boolean;
  b: boolean;
  output: boolean;
}) {
  const signal = (value: boolean) =>
    value ? "logic-signal-on" : "logic-signal-off";
  return (
    <svg
      className="logic-gate-diagram"
      viewBox="0 0 560 260"
      role="img"
      aria-label={`${gates[gate].name}: entrada A ${a ? 1 : 0}${gate === "not" ? "" : `, entrada B ${b ? 1 : 0}`}, saída ${output ? 1 : 0}`}
    >
      <text x="20" y={gate === "not" ? "136" : "86"}>
        A = {Number(a)}
      </text>
      <line
        className={signal(a)}
        x1="82"
        y1={gate === "not" ? "130" : "80"}
        x2="200"
        y2={gate === "not" ? "130" : "80"}
      />
      {gate !== "not" && (
        <>
          <text x="20" y="190">
            B = {Number(b)}
          </text>
          <line className={signal(b)} x1="82" y1="184" x2="200" y2="184" />
        </>
      )}

      {gate === "and" && (
        <path
          className="logic-gate-shape"
          d="M200 45 H280 A85 85 0 0 1 280 215 H200 Z"
        />
      )}
      {gate === "or" && (
        <path
          className="logic-gate-shape"
          d="M200 45 Q260 130 200 215 Q335 215 385 130 Q335 45 200 45 Z"
        />
      )}
      {gate === "not" && (
        <>
          <path className="logic-gate-shape" d="M200 55 L375 130 L200 205 Z" />
          <circle className="logic-gate-shape" cx="393" cy="130" r="18" />
        </>
      )}

      <text
        className="logic-gate-symbol"
        x={gate === "not" ? "274" : "274"}
        y="143"
      >
        {gate === "and" ? "&" : gate === "or" ? "≥1" : "1"}
      </text>
      <line
        className={signal(output)}
        x1={gate === "not" ? "411" : gate === "or" ? "385" : "365"}
        y1="130"
        x2="478"
        y2="130"
      />
      <circle
        className={`logic-output-lamp ${output ? "on" : "off"}`}
        cx="512"
        cy="130"
        r="25"
      />
      <text className="logic-output-label" x="480" y="185">
        Saída {Number(output)}
      </text>
    </svg>
  );
}

export function LogicGatesSimulation() {
  const [gate, setGate] = useState<GateKind>("and"),
    [a, setA] = useState(false),
    [b, setB] = useState(false),
    output = gateResult(gate, a, b),
    rows = useMemo(
      () =>
        gate === "not"
          ? [false, true].map((first) => ({ a: first, b: false }))
          : [false, true].flatMap((first) =>
              [false, true].map((second) => ({ a: first, b: second })),
            ),
      [gate],
    );

  function selectGate(next: GateKind) {
    setGate(next);
    setA(false);
    setB(false);
  }

  function reset() {
    setGate("and");
    setA(false);
    setB(false);
  }

  return (
    <section
      className="logic-simulation stack"
      aria-labelledby="logic-simulation-title"
    >
      <div className="row-between logic-simulation-heading">
        <div>
          <h3 id="logic-simulation-title">Experimente as portas</h3>
          <p>Escolha uma porta e altere as entradas para acompanhar a saída.</p>
        </div>
        <Button variant="outline" onClick={reset}>
          Reiniciar
        </Button>
      </div>

      <div
        className="logic-gate-picker"
        role="group"
        aria-label="Escolha uma porta lógica"
      >
        {(Object.keys(gates) as GateKind[]).map((item) => (
          <Button
            key={item}
            variant={gate === item ? "primary" : "outline"}
            aria-pressed={gate === item}
            onClick={() => selectGate(item)}
          >
            {gates[item].name}
          </Button>
        ))}
      </div>

      <Notice>
        <strong>{gates[gate].expression}:</strong> {gates[gate].explanation}
      </Notice>

      <div className="logic-simulation-workspace">
        <fieldset className="logic-inputs">
          <legend>Entradas</legend>
          <div className="logic-input">
            <span>Entrada A</span>
            <button
              type="button"
              className={`logic-toggle ${a ? "on" : "off"}`}
              aria-label={`Entrada A: ${a ? "ligada" : "desligada"}`}
              aria-pressed={a}
              onClick={() => setA((value) => !value)}
            >
              <Bit value={a} />
              {a ? "Ligada" : "Desligada"}
            </button>
          </div>
          {gate !== "not" && (
            <div className="logic-input">
              <span>Entrada B</span>
              <button
                type="button"
                className={`logic-toggle ${b ? "on" : "off"}`}
                aria-label={`Entrada B: ${b ? "ligada" : "desligada"}`}
                aria-pressed={b}
                onClick={() => setB((value) => !value)}
              >
                <Bit value={b} />
                {b ? "Ligada" : "Desligada"}
              </button>
            </div>
          )}
        </fieldset>

        <div className="logic-visual">
          <GateDiagram gate={gate} a={a} b={b} output={output} />
          <p
            className={`logic-result ${output ? "on" : "off"}`}
            role="status"
            aria-live="polite"
            aria-label={`Saída ${Number(output)}: ${output ? "ligada" : "desligada"}`}
          >
            Saída <strong>{Number(output)}</strong> ·{" "}
            {output ? "Ligada" : "Desligada"}
          </p>
        </div>
      </div>

      <div className="chart-table logic-truth-table">
        <table>
          <caption>Tabela-verdade da porta {gates[gate].name}</caption>
          <thead>
            <tr>
              <th scope="col">A</th>
              {gate !== "not" && <th scope="col">B</th>}
              <th scope="col">Saída</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const result = gateResult(gate, row.a, row.b),
                current = row.a === a && (gate === "not" || row.b === b);
              return (
                <tr
                  key={`${Number(row.a)}-${Number(row.b)}`}
                  aria-current={current ? "true" : undefined}
                >
                  <td>{Number(row.a)}</td>
                  {gate !== "not" && <td>{Number(row.b)}</td>}
                  <td>{Number(result)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
