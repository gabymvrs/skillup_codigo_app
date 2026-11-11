import { useEffect, useId, useState, type CSSProperties } from "react";
import type { Dataset } from "../lib/types";
import {
  loadPracticeCompletions,
  practiceMetrics,
  type PracticeCompletion,
} from "../services/practiceProgress";
import { Button, Notice } from "./ui";
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
  const chartsPreferenceKey = `skillup.practice.charts-expanded:${user}`;
  const [days, setDays] = useState(7),
    [chartsExpanded, setChartsExpanded] = useState(() => {
      try {
        return localStorage.getItem(chartsPreferenceKey) !== "collapsed";
      } catch {
        return true;
      }
    }),
    chartsId = useId(),
    [point, setPoint] = useState<{
      index: number;
      x: number;
      y: number;
    } | null>(null),
    [donutPoint, setDonutPoint] = useState<{
      kind: "correct" | "wrong";
      x: number;
      y: number;
    } | null>(null),
    s = practiceMetrics(data, user, completions, days),
    correctPercent = s.total ? Math.round((s.correct / s.total) * 100) : 0,
    wrongPercent = 100 - correctPercent,
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
      <header className="practice-dashboard-header">
        <div className="practice-dashboard-title">
          <h2>Seu progresso na prática</h2>
        </div>
        {!loading && !error && s.total > 0 && (
          <Button
            variant="outline"
            aria-expanded={chartsExpanded}
            aria-controls={chartsId}
            onClick={() =>
              setChartsExpanded((expanded) => {
                const next = !expanded;
                try {
                  localStorage.setItem(
                    chartsPreferenceKey,
                    next ? "expanded" : "collapsed",
                  );
                } catch {
                  // The preference is optional when browser storage is blocked.
                }
                return next;
              })
            }
          >
            {chartsExpanded ? "Recolher" : "Expandir"}
          </Button>
        )}
      </header>
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
          {!s.total ? (
            <Notice>
              Ainda não há respostas objetivas suficientes para mostrar seu
              desempenho. Comece uma atividade para acompanhar os resultados.
            </Notice>
          ) : (
            <>
              <div
                id={chartsId}
                className="practice-dashboard-details"
                hidden={!chartsExpanded}
              >
                <div className="performance-chart-grid">
                  <section className="card stack performance-card">
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
                                  onFocus={(event) => {
                                    const dot =
                                        event.currentTarget.getBoundingClientRect(),
                                      plot = event.currentTarget
                                        .closest(".performance-plot")!
                                        .getBoundingClientRect();
                                    setPoint({
                                      index: i,
                                      x: dot.left + dot.width / 2 - plot.left,
                                      y: dot.top - plot.top,
                                    });
                                  }}
                                  onBlur={() => setPoint(null)}
                                  onMouseMove={(event) => {
                                    const plot = event.currentTarget
                                      .closest(".performance-plot")!
                                      .getBoundingClientRect();
                                    setPoint({
                                      index: i,
                                      x: event.clientX - plot.left,
                                      y: event.clientY - plot.top,
                                    });
                                  }}
                                  onMouseLeave={() => setPoint(null)}
                                />
                              ),
                            )}
                            <text x="44" y="195">
                              {s.points[0].day.slice(5)}
                            </text>
                            <text x="555" y="195">
                              {s.points.at(-1)?.day.slice(5)}
                            </text>
                          </svg>
                          {point && (
                            <div
                              className="performance-tooltip"
                              role="tooltip"
                              style={{ left: point.x, top: point.y }}
                            >
                              <strong>{s.points[point.index].day}</strong>
                              <span>{s.points[point.index].rate}% de acertos</span>
                              <small>
                                {s.points[point.index].correct} acertos · {" "}
                                {s.points[point.index].wrong} erros
                              </small>
                            </div>
                          )}
                        </div>
                        <div className="performance-dates">
                          <span>{s.points[0].day}</span>
                          <span>{s.points.at(-1)?.day}</span>
                        </div>
                        <p className="sr-only" role="status">
                          {point
                            ? `${s.points[point.index].day}: ${s.points[point.index].rate}% · ${s.points[point.index].correct} acertos e ${s.points[point.index].wrong} erros em ${s.points[point.index].total} tentativas.`
                            : "Selecione um ponto com o mouse ou teclado para ver os detalhes. Dias sem respostas não recebem uma taxa."}
                        </p>
                      </>
                    ) : (
                      <p className="small muted">Sem tentativas neste período.</p>
                    )}
                  </section>
                  <section className="card stack performance-card">
                    <h3>Acertos e erros</h3>
                    <div className="performance-donut-wrap">
                      <div
                        className="performance-donut"
                        role="img"
                        tabIndex={0}
                        aria-label={`${correctPercent}% de acertos: ${s.correct} respostas corretas e ${s.wrong} incorretas`}
                        style={
                          {
                            "--practice-rate": `${correctPercent * 3.6}deg`,
                          } as CSSProperties
                        }
                        onMouseMove={(event) => {
                          const rect =
                              event.currentTarget.getBoundingClientRect(),
                            x = event.clientX - rect.left,
                            y = event.clientY - rect.top,
                            angle =
                              ((Math.atan2(
                                y - rect.height / 2,
                                x - rect.width / 2,
                              ) *
                                180) /
                                Math.PI +
                                450) %
                              360;
                          setDonutPoint({
                            kind:
                              angle < correctPercent * 3.6
                                ? "correct"
                                : "wrong",
                            x,
                            y,
                          });
                        }}
                        onMouseLeave={() => setDonutPoint(null)}
                        onBlur={() => setDonutPoint(null)}
                      >
                        <div>
                          <strong>{correctPercent}%</strong>
                          <span>de acertos</span>
                        </div>
                      </div>
                      {donutPoint && (
                        <div
                          className="performance-tooltip donut-tooltip"
                          role="tooltip"
                          style={{ left: donutPoint.x, top: donutPoint.y }}
                        >
                          <strong>
                            {donutPoint.kind === "correct" ? "Acertos" : "Erros"}
                          </strong>
                          <span>
                            {donutPoint.kind === "correct"
                              ? correctPercent
                              : wrongPercent}
                            % das respostas
                          </span>
                          <small>
                            {donutPoint.kind === "correct" ? s.correct : s.wrong}{" "}
                            {(donutPoint.kind === "correct" ? s.correct : s.wrong) ===
                            1
                              ? "questão"
                              : "questões"}
                          </small>
                        </div>
                      )}
                    </div>
                    <dl className="performance-legend">
                      <div>
                        <dt>
                          <span className="legend-dot correct" /> Acertos
                        </dt>
                        <dd>{s.correct}</dd>
                      </div>
                      <div>
                        <dt>
                          <span className="legend-dot wrong" /> Erros
                        </dt>
                        <dd>{s.wrong}</dd>
                      </div>
                    </dl>
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
