import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { requireSupabase } from "../services/supabase";
import { dateLabel, uid } from "../lib/utils";
import {
  ActionFeedback,
  Badge,
  Button,
  Card,
  Empty,
  Heading,
  Notice,
  useAction,
} from "../components/ui";
export function Messages() {
  const auth = useAuth(),
    repo = useData(),
    [params] = useSearchParams(),
    [recipient, setRecipient] = useState(params.get("para") || ""),
    [body, setBody] = useState(""),
    action = useAction();
  const eligible = repo.data.profiles.filter(
    (p) =>
      p.id !== auth.id &&
      (repo.data.messages.some(
        (m) =>
          (m.sender_id === p.id && m.recipient_id === auth.id) ||
          (m.sender_id === auth.id && m.recipient_id === p.id),
      ) ||
        repo.data.applications.some(
          (a) =>
            (a.student_id === p.id &&
              repo.data.jobs.some(
                (j) => j.id === a.job_id && j.owner_id === auth.id,
              )) ||
            (a.student_id === auth.id &&
              repo.data.jobs.some(
                (j) => j.id === a.job_id && j.owner_id === p.id,
              )),
        ) ||
        repo.data.classes.some(
          (c) =>
            (c.teacher_id === auth.id &&
              repo.data.enrollments.some(
                (e) => e.class_id === c.id && e.user_id === p.id,
              )) ||
            (c.teacher_id === p.id &&
              repo.data.enrollments.some(
                (e) => e.class_id === c.id && e.user_id === auth.id,
              )),
        ) ||
        (auth.role === "instituicao" &&
          repo.data.user_roles.some(
            (r) =>
              r.user_id === p.id && r.organization_id === auth.organizationId,
          ))),
  );
  const messages = repo.data.messages
    .filter(
      (m) =>
        (m.sender_id === auth.id && m.recipient_id === recipient) ||
        (m.recipient_id === auth.id && m.sender_id === recipient),
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  useEffect(() => {
    if (auth.demo) return;
    const client = requireSupabase(),
      channel = client
        .channel(`messages-${auth.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `recipient_id=eq.${auth.id}`,
          },
          () => {
            void repo.reload().catch(() => {});
          },
        )
        .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [auth.id, auth.demo, repo.reload]);
  return (
    <div className="stack narrow">
      <Heading
        title="Mensagens"
        description="Converse com docentes, estudantes e responsáveis por candidaturas vinculadas a você."
      />
      {auth.demo && (
        <Notice>
          As mensagens de demonstração são locais. Nenhuma pessoa receberá o
          conteúdo.
        </Notice>
      )}
      <label>
        Conversa
        <select
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        >
          <option value="">Selecione uma pessoa</option>
          {eligible.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </label>
      {recipient && eligible.some((p) => p.id === recipient) ? (
        <Card>
          <div className="chat-log" role="log" aria-live="polite">
            {messages.map((m) => (
              <div
                className={`chat-message ${m.sender_id === auth.id ? "user" : "bot"}`}
                key={m.id}
              >
                {m.body}
                <small>{dateLabel(m.created_at)}</small>
              </div>
            ))}
            {!messages.length && <Empty title="Conversa sem mensagens" />}
          </div>
          <form
            className="chat-compose"
            onSubmit={(e) => {
              e.preventDefault();
              void action.run(async () => {
                await repo.add("messages", {
                  id: uid(),
                  sender_id: auth.id!,
                  recipient_id: recipient,
                  body: body.trim(),
                  created_at: new Date().toISOString(),
                });
                setBody("");
              });
            }}
          >
            <label className="sr-only" htmlFor="message-compose">
              Mensagem
            </label>
            <input
              id="message-compose"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              required
            />
            <Button
              icon="send"
              type="submit"
              disabled={action.busy || !body.trim()}
            >
              Enviar
            </Button>
          </form>
        </Card>
      ) : (
        <Empty title="Selecione uma conversa">
          Novos contatos aparecem a partir das suas turmas e candidaturas.
        </Empty>
      )}
      <Button
        variant="outline"
        disabled={action.busy}
        onClick={() => action.run(repo.reload)}
      >
        Atualizar mensagens
      </Button>
      <ActionFeedback action={action} />
    </div>
  );
}
export function Notifications() {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    notifications = repo.data.notifications
      .filter((n) => n.user_id === auth.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <div className="stack">
      <Heading
        title="Notificações"
        description="Atualizações de atividades e candidaturas dentro do SkillUp."
      />
      {notifications.map((n) => (
        <Card key={n.id}>
          <div className="row-between">
            <h2>{n.title}</h2>
            {!n.read_at && <Badge>Nova</Badge>}
          </div>
          <p>{n.body}</p>
          <small>{dateLabel(n.created_at)}</small>
          {!n.read_at && (
            <Button
              variant="ghost"
              disabled={action.busy}
              onClick={() =>
                action.run(() =>
                  repo.update("notifications", n.id, {
                    read_at: new Date().toISOString(),
                  }),
                )
              }
            >
              Marcar como lida
            </Button>
          )}
        </Card>
      ))}
      {!notifications.length && (
        <Empty title="Tudo em dia">
          Você não tem notificações neste momento.
        </Empty>
      )}
      <ActionFeedback action={action} />
    </div>
  );
}
