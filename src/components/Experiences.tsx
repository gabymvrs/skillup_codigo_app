import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import type { Experience } from "../lib/types";
import { uid } from "../lib/utils";
import {
  ActionFeedback,
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Modal,
  SectionTitle,
  useAction,
} from "./ui";
const labels: Record<Experience["kind"], string> = {
  projeto: "Projeto",
  estagio: "Estágio",
  emprego: "Emprego",
  voluntariado: "Voluntariado",
};
function date(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
export function Experiences({
  userId,
  editable = false,
}: {
  userId: string;
  editable?: boolean;
}) {
  const { data, remove } = useData(),
    [editing, setEditing] = useState<Experience | "new" | null>(null),
    [removing, setRemoving] = useState<Experience | null>(null);
  const items = data.experiences
    .filter((e) => e.user_id === userId)
    .sort((a, b) => b.started_on.localeCompare(a.started_on));
  return (
    <section className="stack">
      <SectionTitle
        action={
          editable ? (
            <Button
              icon="plus"
              variant="outline"
              onClick={() => setEditing("new")}
            >
              Adicionar experiência
            </Button>
          ) : undefined
        }
      >
        Experiências profissionais
      </SectionTitle>
      {editable && (
        <p className="muted small">
          Inclua também projetos de estudo e voluntariado. São informações
          declaradas por você, compartilhadas com o recrutador ao confirmar uma
          candidatura.
        </p>
      )}
      {items.map((item) => (
        <Card key={item.id}>
          <Badge>{labels[item.kind]}</Badge>
          <h3>{item.title}</h3>
          <p>
            {item.organization} · {date(item.started_on)} —{" "}
            {item.ended_on ? date(item.ended_on) : "Atual"}
          </p>
          <p className="pre-wrap">{item.description}</p>
          {editable && (
            <div className="actions">
              <Button variant="ghost" onClick={() => setEditing(item)}>
                Editar experiência
              </Button>
              <Button
                variant="ghost"
                icon="trash"
                onClick={() => setRemoving(item)}
              >
                Remover experiência
              </Button>
            </div>
          )}
        </Card>
      ))}
      {!items.length && <Empty title="Nenhuma experiência cadastrada" />}
      {editing && (
        <ExperienceEditor
          value={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <Confirm
          title="Remover experiência?"
          onClose={() => setRemoving(null)}
          onConfirm={() => remove("experiences", removing.id)}
        >
          O registro de {removing.title} será removido do seu perfil.
        </Confirm>
      )}
    </section>
  );
}
function ExperienceEditor({
  value,
  onClose,
}: {
  value?: Experience;
  onClose: () => void;
}) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    [current, setCurrent] = useState(value ? !value.ended_on : true);
  return (
    <Modal
      title={value ? "Editar experiência" : "Adicionar experiência"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            started_on = String(f.get("start")),
            ended_on = current ? null : String(f.get("end"));
          if (ended_on && ended_on < started_on) {
            action.setError("O término deve ser igual ou posterior ao início.");
            return;
          }
          const fields = {
            title: String(f.get("title")).trim(),
            organization: String(f.get("organization")).trim(),
            kind: String(f.get("kind")) as Experience["kind"],
            description: String(f.get("description")).trim(),
            started_on,
            ended_on,
          };
          void action.run(async () => {
            if (value) await repo.update("experiences", value.id, fields);
            else
              await repo.add("experiences", {
                ...fields,
                id: uid(),
                user_id: auth.id!,
              });
            onClose();
          });
        }}
      >
        <label>
          Título da experiência
          <input
            name="title"
            defaultValue={value?.title}
            minLength={2}
            maxLength={120}
            required
          />
        </label>
        <label>
          Organização ou contexto
          <input
            name="organization"
            defaultValue={value?.organization}
            minLength={2}
            maxLength={160}
            placeholder="Escola, empresa ou projeto pessoal"
            required
          />
        </label>
        <label>
          Tipo
          <select name="kind" defaultValue={value?.kind || "projeto"}>
            {Object.entries(labels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data de início
          <input
            name="start"
            type="date"
            defaultValue={value?.started_on}
            required
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={current}
            onChange={(e) => setCurrent(e.target.checked)}
          />
          Em andamento
        </label>
        {!current && (
          <label>
            Data de término
            <input
              name="end"
              type="date"
              defaultValue={value?.ended_on || ""}
              required
            />
          </label>
        )}
        <label>
          Atividades e aprendizados
          <textarea
            name="description"
            defaultValue={value?.description}
            rows={5}
            minLength={10}
            maxLength={3000}
            required
          />
        </label>
        <Button type="submit" disabled={action.busy}>
          Salvar experiência
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
