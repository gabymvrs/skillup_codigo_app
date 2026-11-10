import { SupportHistory, SupportQueue } from "./SupportHistory";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { faq } from "../data/faq";
import {
  advance,
  initialTriage,
  summary,
  type Triage,
} from "../services/triage";
import { copyText, matches, uid } from "../lib/utils";
import {
  ActionFeedback,
  Badge,
  Button,
  Chips,
  Empty,
  Icon,
  Modal,
  Notice,
  SearchField,
  useAction,
} from "./ui";
export function FAQ() {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("Todas");
  const items = faq.filter(
    (x) =>
      (category === "Todas" || x.category === category) &&
      matches(query, x.question, x.answer),
  );
  return (
    <div className="stack">
      <SearchField
        label="Buscar perguntas frequentes"
        value={query}
        onChange={setQuery}
      />
      <Chips
        items={["Todas", ...new Set(faq.map((x) => x.category))]}
        value={category}
        onChange={setCategory}
      />
      <p className="muted small">{items.length} respostas encontradas</p>
      <div className="faq-list">
        {items.map((x) => (
          <details key={x.question}>
            <summary>
              {x.question}
              <Icon name="chevron" />
            </summary>
            <p>{x.answer}</p>
          </details>
        ))}
        {!items.length && (
          <Empty title="Nenhuma resposta encontrada">
            Tente outra palavra ou escolha outra categoria.
          </Empty>
        )}
      </div>
    </div>
  );
}
export function SupportContent({
  onNavigate,
}: { onNavigate?: () => void } = {}) {
  const auth = useAuth(),
    repo = useData(),
    key = `skillup.triage.${auth.demo ? "demo." : ""}${auth.id}`;
  const [tab, setTab] = useState<"bot" | "faq" | "teachers">("bot"),
    [message, setMessage] = useState(""),
    [state, setState] = useState<Triage>(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) || "null");
        if (
          saved &&
          Array.isArray(saved.messages) &&
          ["topic", "detail", "urgency", "done"].includes(saved.stage)
        )
          return saved;
      } catch {
        /* start fresh */
      }
      return initialTriage();
    }),
    [showSummary, setShowSummary] = useState(false),
    [copyFallback, setCopyFallback] = useState(false),
    [recorded, setRecorded] = useState(false);
  const action = useAction(),
    log = useRef<HTMLDivElement>(null),
    messageId = useId();
  const teachers = [
    ...new Set(
      repo.data.classes
        .filter((classroom) =>
          repo.data.enrollments.some(
            (enrollment) =>
              enrollment.class_id === classroom.id &&
              enrollment.user_id === auth.id,
          ),
        )
        .map((classroom) => classroom.teacher_id),
    ),
  ]
    .map((id) => repo.data.profiles.find((profile) => profile.id === id))
    .filter((profile) => !!profile);
  useEffect(() => {
    const receive = (event: Event) => {
      const value = (event as CustomEvent<{ key: string; state: Triage }>)
        .detail;
      if (value.key === key) setState(value.state);
    };
    window.addEventListener("skillup:triage", receive);
    return () => window.removeEventListener("skillup:triage", receive);
  }, [key]);
  function replaceConversation(next: Triage) {
    setState(next);
    window.dispatchEvent(
      new CustomEvent("skillup:triage", { detail: { key, state: next } }),
    );
  }
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* session may be read-only */
    }
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [state, key]);
  function send(text: string) {
    replaceConversation(advance(state, text));
    setMessage("");
  }
  async function record() {
    await repo.add("support_tickets", {
      id: uid(),
      user_id: auth.id!,
      topic: state.topic,
      urgency: state.urgency,
      summary: summary(state),
      assigned_to: null,
      response: null,
      status: "open",
      created_at: new Date().toISOString(),
    });
    setRecorded(true);
  }
  return (
    <div className="support-content">
      <div
        className="support-tabs"
        role="tablist"
        aria-label="Opções da central de ajuda"
      >
        {[
          ["bot", "cpu", "Bot IA"],
          ["faq", "book", "FAQ"],
          ["teachers", "graduation", "Professores"],
        ].map(([value, icon, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value as typeof tab)}
          >
            <Icon name={icon} size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {tab === "faq" ? (
        <div role="tabpanel">
          <FAQ />
        </div>
      ) : tab === "teachers" ? (
        <div className="stack support-teachers" role="tabpanel">
          <div>
            <h3>Conversar com professores</h3>
            <p className="small muted">
              Abra rapidamente o chat com um docente da sua turma.
            </p>
          </div>
          {teachers.map((teacher) => (
            <Link
              className="support-teacher"
              key={teacher.id}
              to={`/app/mensagens?para=${teacher.id}`}
              onClick={onNavigate}
              aria-label={`Conversar com ${teacher.full_name}`}
            >
              <Icon name="message" />
              <span className="support-teacher-details">
                <strong>{teacher.full_name}</strong>
                <span className="small muted">
                  {teacher.headline || "Docente da sua turma"}
                </span>
              </span>
              <span className="small support-teacher-action">Conversar</span>
            </Link>
          ))}
          {!teachers.length && (
            <div className="stack">
              <p className="small muted">
                Nenhum professor está vinculado à sua turma no momento.
              </p>
              <Link
                className="button outline"
                to="/app/aprenda/suporte"
                onClick={onNavigate}
              >
                Abrir suporte acadêmico
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="stack" role="tabpanel">
          <div className="row-between">
            <span className="small muted">
              Automático · sem atendente conectado
            </span>
            <Button
              variant="ghost"
              onClick={() => {
                replaceConversation(initialTriage());
                setShowSummary(false);
                setRecorded(false);
                setCopyFallback(false);
              }}
            >
              Reiniciar
            </Button>
          </div>
          <div
            className="chat-log"
            role="log"
            aria-live="polite"
            aria-label="Conversa com o bot"
            ref={log}
          >
            {state.messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.who}`}>
                <span className="sr-only">
                  {m.who === "bot" ? "Bot:" : "Você:"}
                </span>
                {m.text}
              </div>
            ))}
          </div>
          {state.stage !== "done" && (
            <>
              <div className="chips">
                {(state.stage === "topic"
                  ? [
                      "Esqueci minha senha",
                      "Material offline",
                      "Minha candidatura",
                    ]
                  : state.stage === "urgency"
                    ? [
                        "Impede uma entrega hoje",
                        "Dificulta meus estudos",
                        "Dúvida sem prazo",
                      ]
                    : []
                ).map((x) => (
                  <button key={x} onClick={() => send(x)}>
                    {x}
                  </button>
                ))}
              </div>
              <form
                className="chat-compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) send(message);
                }}
              >
                <label className="sr-only" htmlFor={messageId}>
                  Mensagem para o bot
                </label>
                <input
                  id={messageId}
                  placeholder="Digite sua dúvida…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  required
                />
                <Button
                  type="submit"
                  aria-label="Enviar mensagem"
                  disabled={!message.trim()}
                  icon="send"
                >
                  Enviar
                </Button>
              </form>
            </>
          )}
          {state.stage === "done" && (
            <>
              <Badge>Prioridade {state.urgency.toLowerCase()}</Badge>
              <Button
                variant="outline"
                onClick={() => setShowSummary((v) => !v)}
              >
                {showSummary ? "Ocultar resumo" : "Ver resumo do atendimento"}
              </Button>
              {showSummary && (
                <div className="summary-box">
                  <pre>{summary(state)}</pre>
                  <Button
                    variant="outline"
                    icon="clipboard"
                    onClick={() =>
                      action.run(async () => {
                        if (!(await copyText(summary(state))))
                          setCopyFallback(true);
                        else action.setSuccess("Resumo copiado.");
                      })
                    }
                  >
                    Copiar resumo
                  </Button>
                  {copyFallback && (
                    <label>
                      Selecione e copie manualmente
                      <textarea
                        readOnly
                        value={summary(state)}
                        onFocus={(e) => e.target.select()}
                      />
                    </label>
                  )}
                  <Button
                    disabled={action.busy || recorded}
                    onClick={() =>
                      action.run(
                        record,
                        auth.demo
                          ? "Resumo salvo na demonstração local."
                          : "Resumo salvo no seu histórico. Não há confirmação de atendimento humano.",
                      )
                    }
                  >
                    {recorded
                      ? "Salvo no histórico"
                      : "Salvar no meu histórico"}
                  </Button>
                </div>
              )}
            </>
          )}
          <ActionFeedback action={action} />
          <p className="small muted">
            Evite informar senhas ou documentos pessoais na conversa.
          </p>
        </div>
      )}
    </div>
  );
}
export function GlobalSupport() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="help-fab"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="message" />
        <span>Dúvidas?</span>
      </button>
      {open && (
        <Modal
          title="Como podemos ajudar?"
          className="support-dialog"
          onClose={() => setOpen(false)}
        >
          <SupportContent onNavigate={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
export function SupportPage() {
  const { data } = useData(),
    auth = useAuth();
  return (
    <div className="stack">
      <h1>
        {auth.role === "docente" ? "Central de suporte" : "Suporte ao aluno"}
      </h1>
      {auth.role === "docente" && <SupportQueue />}
      <Notice>
        O bot organiza sua dúvida. Para falar com sua instituição, use os canais
        oficiais ou as mensagens entre contas autorizadas.
      </Notice>
      <div className="two-columns">
        <section className="card">
          <SupportContent />
        </section>
        <section className="card">
          <SupportHistory />
          <h2>Feedback recente</h2>
          {data.submissions
            .filter((x) => x.student_id === auth.id && x.status === "reviewed")
            .map((x) => (
              <article className="list-row" key={x.id}>
                <div>
                  <strong>
                    {
                      data.assignments.find((a) => a.id === x.assignment_id)
                        ?.title
                    }
                  </strong>
                  <p>{x.feedback}</p>
                </div>
                <Badge>Nota {x.grade}</Badge>
              </article>
            ))}
        </section>
      </div>
    </div>
  );
}
