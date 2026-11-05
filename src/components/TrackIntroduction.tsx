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
            {expanded
              ? "Recolher apresentação"
              : "Rever apresentação da trilha"}
          </Button>
        </div>
        <h2 ref={heading}>Conheça a trilha: {track.title}</h2>
        <div id={`intro-${track.id}`} hidden={!expanded} className="stack">
          <p>{intro.about}</p>
          <p>{intro.context}</p>
          <h3>Onde esse conhecimento é usado?</h3>
          <ul>
            {intro.applications.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <h3>O que você vai aprender</h3>
          <ul>
            {intro.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <h3>O que poderá realizar neste percurso</h3>
          <p>{intro.outcome}</p>
          <h3>O que preciso saber antes?</h3>
          <p>{intro.prerequisites}</p>
          <h3>Seu percurso de aprendizagem</h3>
          <ol>
            {modules.map((m) => (
              <li key={m.id}>{m.title}</li>
            ))}
          </ol>
          <h3>Como funcionam as atividades?</h3>
          <p>
            Cada bolinha reúne Teoria, Prática e Dinâmica na mesma atividade.
            Você pode alternar entre as três partes e pular para a prática,
            retornando à teoria depois. Para concluir, registre as três partes.
            A prática oferece correção e novas tentativas; a dinâmica aplica o
            que foi estudado. A conclusão válida registra seu resultado, concede
            XP uma única vez e libera a próxima etapa.
          </p>
          <p>
            O conteúdo das etapas depende do que veio antes. Se encontrar um
            termo desconhecido, volte à explicação; os recursos complementares
            são opcionais. Você pode estudar outras trilhas em paralelo.
          </p>
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
