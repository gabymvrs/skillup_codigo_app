import { useEffect, useState } from "react";
import { useAuth } from "../state/AuthContext";
import {
  learningResources,
  savedResourceIds,
  saveResource,
} from "../services/lessonJourney";
import { ActionFeedback, Button, Card, useAction } from "./ui";
export function safeResourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function LearningResources({
  ids,
  savedOnly = false,
}: {
  ids?: string[];
  savedOnly?: boolean;
}) {
  const auth = useAuth(),
    [saved, setSaved] = useState<string[]>([]),
    action = useAction();
  useEffect(() => {
    let active = true;
    savedResourceIds(auth.demo, auth.id!)
      .then((ids) => {
        if (active) setSaved(ids);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [auth.id, auth.demo]);
  const visible = learningResources.filter(
    (r) => (!ids || ids.includes(r.id)) && (!savedOnly || saved.includes(r.id)),
  );
  if (!visible.length)
    return savedOnly ? (
      <p className="muted">
        Salve um recurso nas atividades para encontrá-lo aqui.
      </p>
    ) : null;
  return (
    <section className="stack" aria-label="Recursos para aprender mais">
      <h3>{savedOnly ? "Recursos salvos" : "Aprofunde seu conhecimento"}</h3>
      {visible.map((r) => {
        const url = safeResourceUrl(r.url);
        if (!url) return null;
        return (
          <Card key={r.id}>
            <details>
              <summary>
                <strong>{r.title}</strong> · {r.kind}
              </summary>
              <p>
                {r.publisher} ·{" "}
                {new URL(r.url).hostname === "docs.python.org" ||
                r.url.includes("/pt-BR/")
                  ? "Português brasileiro"
                  : "Inglês"}
              </p>
              <a href={url} target="_blank" rel="noopener noreferrer">
                Abrir recurso externo ↗
              </a>
            </details>
            <Button
              variant="outline"
              disabled={action.busy}
              aria-pressed={saved.includes(r.id)}
              onClick={() =>
                action.run(async () => {
                  await saveResource(
                    auth.demo,
                    auth.id!,
                    r.id,
                    !saved.includes(r.id),
                  );
                  setSaved(await savedResourceIds(auth.demo, auth.id!));
                })
              }
            >
              {saved.includes(r.id)
                ? "Remover dos salvos"
                : "Salvar para estudar"}
            </Button>
          </Card>
        );
      })}
      <ActionFeedback action={action} />
    </section>
  );
}
