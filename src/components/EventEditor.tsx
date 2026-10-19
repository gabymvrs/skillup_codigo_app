import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { uid } from "../lib/utils";
import type { StudyEvent } from "../lib/types";
import { Button, Modal, useAction, ActionFeedback } from "./ui";
export function EventEditor({
  onClose,
  event,
}: {
  onClose: () => void;
  event?: StudyEvent;
}) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    [done, setDone] = useState(false);
  return (
    <Modal
      title={event ? "Editar evento" : "Adicionar à agenda"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            const fields = {
              title: String(f.get("title")).trim(),
              description: String(f.get("description")),
              starts_at: new Date(String(f.get("date"))).toISOString(),
              duration_minutes: Number(f.get("duration")),
            };
            if (event) await repo.update("study_events", event.id, fields);
            else
              await repo.add("study_events", {
                ...fields,
                id: uid(),
                user_id: auth.id!,
                class_id: String(f.get("class_id") || "") || null,
              });
            setDone(true);
          }, "Evento salvo na agenda.");
        }}
      >
        <label>
          Título
          <input
            name="title"
            defaultValue={event?.title}
            maxLength={120}
            required
          />
        </label>
        <label>
          Data e horário local
          <input
            type="datetime-local"
            name="date"
            defaultValue={
              event
                ? new Date(
                    new Date(event.starts_at).getTime() -
                      new Date(event.starts_at).getTimezoneOffset() * 60000,
                  )
                    .toISOString()
                    .slice(0, 16)
                : ""
            }
            required
          />
        </label>
        <label>
          Duração em minutos
          <input
            name="duration"
            type="number"
            defaultValue={event?.duration_minutes || 15}
            min={5}
            max={480}
            step={5}
            required
          />
        </label>
        <label>
          Descrição
          <textarea
            name="description"
            defaultValue={event?.description}
            maxLength={2000}
          />
        </label>
        {(auth.role === "docente" || auth.role === "instituicao") && (
          <label>
            Visibilidade
            <select
              name="class_id"
              defaultValue={event?.class_id || ""}
              disabled={Boolean(event)}
            >
              <option value="">Somente minha agenda</option>
              {repo.data.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button type="submit" disabled={action.busy || done}>
          {done ? "Salvo" : "Salvar evento"}
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
