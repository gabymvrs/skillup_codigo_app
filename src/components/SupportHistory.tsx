import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { requireSupabase } from "../services/supabase";
import type { SupportTicket } from "../lib/types";
import {
  ActionFeedback,
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Modal,
  Notice,
  useAction,
} from "./ui";
export function SupportHistory() {
  const auth = useAuth(),
    repo = useData(),
    [sharing, setSharing] = useState<SupportTicket | null>(null),
    action = useAction();
  const own = repo.data.support_tickets
    .filter((t) => t.user_id === auth.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const teachers = [
    ...new Set(
      repo.data.classes
        .filter((c) =>
          repo.data.enrollments.some(
            (e) => e.class_id === c.id && e.user_id === auth.id,
          ),
        )
        .map((c) => c.teacher_id),
    ),
  ];
  return (
    <>
      <h2>Histórico de atendimentos</h2>
      {own.map((t) => (
        <details className="ticket" key={t.id}>
          <summary>
            {t.topic} · {t.urgency}
          </summary>
          <pre>{t.summary}</pre>
          <Badge>
            {t.status === "answered"
              ? "Respondido"
              : t.assigned_to
                ? "Compartilhado com docente"
                : "Somente no seu histórico"}
          </Badge>
          {t.response && (
            <Notice>
              <strong>Resposta do docente:</strong>
              <p className="pre-wrap">{t.response}</p>
            </Notice>
          )}
          {!t.assigned_to && teachers.length > 0 && (
            <Button variant="outline" onClick={() => setSharing(t)}>
              Compartilhar com docente
            </Button>
          )}
        </details>
      ))}
      {!own.length && (
        <Empty title="Nenhum resumo salvo">
          Os resumos que você salvar aparecerão aqui.
        </Empty>
      )}
      {sharing && (
        <Modal
          title="Compartilhar resumo com docente"
          onClose={() => setSharing(null)}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const teacher = String(
                new FormData(e.currentTarget).get("teacher"),
              );
              void action.run(
                async () => {
                  if (auth.demo)
                    await repo.update("support_tickets", sharing.id, {
                      assigned_to: teacher,
                    });
                  else {
                    const { error } = await requireSupabase().rpc(
                      "route_support_ticket",
                      { p_ticket_id: sharing.id, p_teacher_id: teacher },
                    );
                    if (error) throw error;
                    await repo.reload();
                  }
                  setSharing(null);
                },
                auth.demo
                  ? "Compartilhamento demonstrativo salvo. Nenhum docente real foi notificado."
                  : "Resumo registrado na fila do docente. A resposta depende da disponibilidade dele.",
              );
            }}
          >
            <p>
              O docente escolhido poderá ler todo o resumo e responder pelo
              SkillUp. Revise o conteúdo antes de confirmar.
            </p>
            <pre className="summary-box">{sharing.summary}</pre>
            <label>
              Docente da sua turma
              <select name="teacher" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {teachers.map((id) => (
                  <option key={id} value={id}>
                    {repo.data.profiles.find((p) => p.id === id)?.full_name ||
                      "Docente vinculado"}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-label">
              <input type="checkbox" required />
              Autorizo compartilhar este resumo com o docente selecionado.
            </label>
            <Button type="submit" disabled={action.busy}>
              Confirmar compartilhamento
            </Button>
            <ActionFeedback action={action} />
          </form>
        </Modal>
      )}
      <ActionFeedback action={action} />
    </>
  );
}
export function SupportQueue() {
  const auth = useAuth(),
    repo = useData(),
    [urgency, setUrgency] = useState("Todas"),
    [ticket, setTicket] = useState<SupportTicket | null>(null),
    action = useAction();
  const items = repo.data.support_tickets
    .filter(
      (t) =>
        t.assigned_to === auth.id &&
        (urgency === "Todas" || t.urgency === urgency),
    )
    .sort(
      (a, b) =>
        ["Alta", "Média", "Baixa"].indexOf(a.urgency) -
        ["Alta", "Média", "Baixa"].indexOf(b.urgency),
    );
  return (
    <section className="stack">
      <h2>Dúvidas compartilhadas pelos estudantes</h2>
      <Chips
        value={urgency}
        onChange={setUrgency}
        items={["Todas", "Alta", "Média", "Baixa"]}
      />
      {items.map((t) => (
        <Card key={t.id}>
          <div className="row-between">
            <Badge>{t.urgency}</Badge>
            <Badge tone={t.response ? "success" : ""}>
              {t.response ? "Respondida" : "Aguardando resposta"}
            </Badge>
          </div>
          <h3>{t.topic}</h3>
          <p>
            {repo.data.profiles.find((p) => p.id === t.user_id)?.full_name ||
              "Estudante vinculado"}
          </p>
          <Button variant="outline" onClick={() => setTicket(t)}>
            {t.response ? "Ver e revisar resposta" : "Responder dúvida"}
          </Button>
        </Card>
      ))}
      {!items.length && (
        <Empty title="Nenhuma dúvida compartilhada">
          A fila recebe apenas resumos que os estudantes decidirem compartilhar
          com você.
        </Empty>
      )}
      {ticket && (
        <Modal title={ticket.topic} onClose={() => setTicket(null)}>
          <pre className="summary-box">{ticket.summary}</pre>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const response = String(
                new FormData(e.currentTarget).get("response"),
              ).trim();
              void action.run(async () => {
                if (auth.demo)
                  await repo.update("support_tickets", ticket.id, {
                    response,
                    status: "answered",
                  });
                else {
                  const { error } = await requireSupabase().rpc(
                    "answer_support_ticket",
                    { p_ticket_id: ticket.id, p_response: response },
                  );
                  if (error) throw error;
                  await repo.reload();
                }
                setTicket(null);
              }, "Resposta registrada no histórico do estudante.");
            }}
          >
            <label>
              Orientação ao estudante
              <textarea
                name="response"
                rows={6}
                defaultValue={ticket.response || ""}
                minLength={10}
                maxLength={4000}
                required
              />
            </label>
            <Button type="submit" disabled={action.busy}>
              Salvar resposta
            </Button>
            <ActionFeedback action={action} />
          </form>
        </Modal>
      )}
      <ActionFeedback action={action} />
    </section>
  );
}
