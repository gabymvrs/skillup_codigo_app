import { useEffect, useId, useState } from "react";
import type { Dataset } from "../lib/types";
import {
  loadPracticeCompletions,
  practiceMetrics,
  type PracticeCompletion,
} from "../services/practiceProgress";
import { Button, Icon, Notice } from "./ui";
export function usePracticeCompletions(demo: boolean, user: string) {
  const [rows, setRows] = useState<PracticeCompletion[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setRows([]);
    loadPracticeCompletions(demo, user)
      .then((r) => {
        if (active) {
          setRows(r);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError("Não foi possível carregar as conclusões dos blocos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [demo, user, revision]);
  useEffect(() => {
    const refresh = () => setRevision((r) => r + 1);
    window.addEventListener("skillup:practice-completed", refresh);
    return () =>
      window.removeEventListener("skillup:practice-completed", refresh);
  }, []);
  return { rows, loading, error, retry: () => setRevision((r) => r + 1) };
}
export function PracticeDashboard({
  data,
  user,
  demo,
  completions,
  loading,
  error,
  onRetry,
}: {
  data: Dataset;
  user: string;
  demo: boolean;
  completions: PracticeCompletion[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const [days, setDays] = useState(7),
    [chartsExpanded, setChartsExpanded] = useState(true),
    chartsId = useId(),
    [point, setPoint] = useState<number | null>(null),
    s = practiceMetrics(data, user, completions, days),
    w = 640,
    h = 200;
  let path = "",
    previous = false;
  s.points.forEach((p, i) => {
    if (p.rate === null) {
      previous = false;
      return;
    }
    const x = 44 + (i * (w - 64)) / (days - 1),
      y = 170 - p.rate * 1.4;
    path += `${previous ? "L" : "M"}${x},${y} `;
    previous = true;
  });
  return (
    <section
      className="practice-dashboard stack"
      aria-label="Painel de prática do aluno"
    >
      <div>
        <h2>Seu progresso na prática</h2>
        <p>
          {demo
            ? "Dados da demonstração neste navegador. "
            : "Dados da sua conta. "}
          Acertos e erros consideram tentativas objetivas; produções abertas
          ficam fora da taxa.
        </p>
      </div>
      {loading ? (
        <p role="status">Carregando desempenho…</p>
      ) : error ? (
        <Notice tone="warning">
          {error}{" "}
          <Button variant="outline" onClick={onRetry}>
            Tentar novamente
          </Button>
        </Notice>
      ) : (
        <>
          <dl className="practice-metric-grid">
            {[
              [
                "Práticas concluídas",
                s.completed,
                "Blocos completos, contados uma vez",
                "check",
              ],
              [
                "Taxa de acertos",
                s.rate === null ? "—" : s.rate + "%",
                "Todas as tentativas avaliadas",
                "award",
              ],
              [
                "Questões corretas",
                s.correct,
                "Acertos por tentativa",
                "check",
              ],
              [
                "Questões incorretas",
                s.wrong,
                "Erros por tentativa",
                "clipboard",
              ],
            ].map(([label, value, desc, icon]) => (
              <div className="card" key={label}>
                <Icon name={String(icon)} />
                <dt>{label}</dt>
                <dd>{value}</dd>
                <small>{desc}</small>
              </div>
            ))}
          </dl>
          <p className="small muted">
            {s.uniqueQuestions} questões distintas · {s.total} tentativas
            avaliadas. Questões avulsas não contam como bloco concluído.
            Conclusões anteriores sem registro de finalização não são estimadas.
            Tempo de estudo não registrado.
          </p>
          {!s.total ? (
            <Notice>
              Você ainda não tem respostas objetivas suficientes para visualizar
              seu desempenho. Comece uma atividade para acompanhar sua evolução.
            </Notice>
          ) : (
            <>
              <div>
                <Button
                  variant="outline"
                  aria-expanded={chartsExpanded}
                  aria-controls={chartsId}
                  onClick={() => setChartsExpanded((expanded) => !expanded)}
                >
                  {chartsExpanded ? "Recolher gráficos" : "Mostrar gráficos"}
                </Button>
              </div>
              <div id={chartsId} hidden={!chartsExpanded}>
                <div className="performance-chart-grid">
                  <section className="card stack">
                    <div className="row-between">
                      <h3>Evolução de desempenho</h3>
                      <label>
                        Período
                        <select
                          value={days}
                          onChange={(e) => {
                            setDays(Number(e.target.value));
                            setPoint(null);
                          }}
                        >
                          <option value={7}>7 dias</option>
                          <option value={30}>30 dias</option>
                        </select>
                      </label>
                    </div>
                    {s.points.some((p) => p.total) ? (
                      <>
                        <div className="performance-plot">
                          <div className="performance-axis" aria-hidden="true">
                            <span>100%</span>
                            <span>50%</span>
                            <span>0%</span>
                          </div>
                          <svg
                            className="performance-line"
                            viewBox={`0 0 ${w} ${h}`}
                            role="img"
                            aria-label={`Taxa diária de acertos nos últimos ${days} dias, de 0 a 100 por cento`}
                          >
                            {[0, 50, 100].map((n) => (
                              <g key={n}>
                                <line
                                  x1="44"
                                  x2="620"
                                  y1={170 - n * 1.4}
                                  y2={170 - n * 1.4}
                                  stroke="currentColor"
                                  opacity=".15"
                                />
                                <text x="3" y={174 - n * 1.4}>
                                  {n}%
                                </text>
                              </g>
                            ))}
                            <path
                              d={path}
                              fill="none"
                              stroke="#193f9f"
                              strokeWidth="3"
                            />
                            {s.points.map((p, i) =>
                              p.rate === null ? null : (
                                <circle
                                  key={p.day}
                                  cx={44 + (i * (w - 64)) / (days - 1)}
                                  cy={170 - p.rate * 1.4}
                                  r="5"
                                  fill="#193f9f"
                                  tabIndex={0}
                                  aria-label={`${p.day}: ${p.rate}%, ${p.correct} acertos em ${p.total} tentativas`}
                                  onFocus={() => setPoint(i)}
                                  onMouseEnter={() => setPoint(i)}
                                >
                                  <title>
                                    {p.day}: {p.rate}% · {p.correct}/{p.total}{" "}
                                    acertos
                                  </title>
                                </circle>
                              ),
                            )}
                            <text x="44" y="195">
                              {s.points[0].day.slice(5)}
                            </text>
                            <text x="555" y="195">
                              {s.points.at(-1)?.day.slice(5)}
                            </text>
                          </svg>
                        </div>
                        <div className="performance-dates">
                          <span>{s.points[0].day}</span>
                          <span>{s.points.at(-1)?.day}</span>
                        </div>
                        <p role="status">
                          {point !== null
                            ? `${s.points[point].day}: ${s.points[point].rate}% · ${s.points[point].correct} acertos e ${s.points[point].wrong} erros em ${s.points[point].total} tentativas.`
                            : "Selecione um ponto com o mouse ou teclado para ver os detalhes. Dias sem respostas não recebem uma taxa."}
                        </p>
                      </>
                    ) : (
                      <p>
                        Não há tentativas nesse período. Seu histórico geral foi
                        preservado.
                      </p>
                    )}
                    <details>
                      <summary>Ver dados do gráfico em tabela</summary>
                      <div className="chart-table">
                        <table>
                          <caption>Desempenho por dia</caption>
                          <thead>
                            <tr>
                              <th>Dia</th>
                              <th>Acertos</th>
                              <th>Erros</th>
                              <th>Taxa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.points.map((p) => (
                              <tr key={p.day}>
                                <th>{p.day}</th>
                                <td>{p.correct}</td>
                                <td>{p.wrong}</td>
                                <td>
                                  {p.rate === null
                                    ? "Sem tentativas"
                                    : p.rate + "%"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </section>
                  <section className="card stack">
                    <h3>Acertos e erros</h3>
                    <p>Histórico completo de tentativas objetivas</p>
                    {[
                      ["Acertos", s.correct, "#187948"],
                      ["Erros", s.wrong, "#b42332"],
                    ].map(([label, count, color]) => (
                      <div key={label}>
                        <p>
                          <strong>
                            {label}: {count}
                          </strong>{" "}
                          · {Math.round((Number(count) / s.total) * 100)}%
                        </p>
                        <div
                          className="performance-bar"
                          role="img"
                          aria-label={`${label}: ${count} de ${s.total}`}
                        >
                          <span
                            style={{
                              width: `${(Number(count) / s.total) * 100}%`,
                              background: String(color),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
