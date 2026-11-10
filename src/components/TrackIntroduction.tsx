import { useEffect, useRef, useState } from "react";
import introductions from "../data/track-introductions.json";
import type { Track, Module } from "../lib/types";
import { Badge, Button, Card, useAction, ActionFeedback } from "./ui";
export const trackIntroductions = introductions as Record<
  string,
  {
    about: string;
    context: string;
    applications: string[];
    objectives: string[];
    outcome: string;
    prerequisites: string;
    difficulty: string;
  }
>;
export function TrackIntroduction({
  track,
  modules,
  owner,
  student,
  busy,
  onBegin,
}: {
  track: Track;
  modules: Module[];
  owner: string;
  student: boolean;
  busy: boolean;
  onBegin: () => Promise<void>;
}) {
  const action = useAction();
  const intro = trackIntroductions[track.id],
    key = `skillup.track-intro.${owner}.${track.id}`;
  const [expanded, setExpanded] = useState(true),
    [storageError, setStorageError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    try {
      setExpanded(localStorage.getItem(key) !== "seen");
    } catch {
      setExpanded(true);
    }
  }, [key]);
  if (!intro) return null;
  async function begin() {
    await onBegin();
    try {
      localStorage.setItem(key, "seen");
    } catch {
      setStorageError(true);
    }
    setExpanded(false);
  }
  return (
    <Card className="track-introduction">
      <div className="stack">
        <div className="actions">
          <Badge>{intro.difficulty}</Badge>
          <Button
            variant="outline"
            aria-expanded={expanded}
            aria-controls={`intro-${track.id}`}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Recolher apresentação" : "Expandir apresentação"}
          </Button>
        </div>
        <h2 ref={heading}>{track.title}</h2>
        <div
          id={`intro-${track.id}`}
          hidden={!expanded}
          className="stack track-introduction-content"
        >
          <section className="intro-section">
            <h3>Visão geral</h3>
            <ul>
              <li>{intro.about}</li>
              <li>{intro.context}</li>
            </ul>
          </section>
          <div className="intro-grid">
            <section className="intro-section">
              <h3>Onde você pode usar</h3>
              <ul>
                {intro.applications.map((application) => (
                  <li key={application}>{application}</li>
                ))}
              </ul>
            </section>
            <section className="intro-section">
              <h3>O que você vai aprender</h3>
              <ul>
                {intro.objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </section>
          </div>
          <div className="intro-grid">
            <section className="intro-section">
              <h3>Ao concluir</h3>
              <p>{intro.outcome}</p>
            </section>
            <section className="intro-section">
              <h3>Antes de começar</h3>
              <p>{intro.prerequisites}</p>
            </section>
          </div>
          <section className="intro-section">
            <h3>Como funciona</h3>
            <ul>
              <li>{modules.length} etapas no percurso.</li>
              <li>Cada etapa reúne Teoria, Prática e Dinâmica.</li>
              <li>Você pode alternar entre as partes e tentar novamente.</li>
              <li>
                Ao concluir as três partes, você recebe o XP uma vez e libera a
                próxima etapa.
              </li>
            </ul>
          </section>
        </div>
        {student && (
          <Button
            disabled={busy || action.busy}
            onClick={() => {
              void action.run(begin);
            }}
          >
            Começar trilha
          </Button>
        )}
        <ActionFeedback action={action} />
        {storageError && (
          <p role="status">
            Você pode rever a apresentação nesta página. O navegador não
            permitiu guardar a preferência.
          </p>
        )}
      </div>
    </Card>
  );
}
