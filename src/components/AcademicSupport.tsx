import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { normalize, uid } from "../lib/utils";
import { Avatar } from "./Avatar";
import { FAQ } from "./Support";
import { SupportHistory, SupportQueue } from "./SupportHistory";
import {
  ActionFeedback,
  ActionLink,
  Badge,
  Button,
  Card,
  Empty,
  Heading,
  Icon,
  Modal,
  Notice,
  useAction,
} from "./ui";
function academicAnswer(input: string) {
  const text = normalize(input);
  if (/curso|turma|matricula/.test(text))
    return "A troca de curso depende das regras da sua instituição. Confira sua matrícula e envie ao docente ou à coordenação o curso atual, o curso desejado e sua dúvida. Nenhuma alteração foi feita aqui.";
  if (/senha|login|acesso/.test(text))
    return "Na tela de login, selecione Esqueci minha senha e confira o e-mail, inclusive o spam. Não informe sua senha a ninguém. Se o problema for a matrícula, procure sua instituição.";
  if (/estud|aprender|revis|dificuldade/.test(text))
    return "Escolha um conteúdo pequeno, leia e tente explicá-lo sem consultar. Faça um exercício e revise a explicação. Qual matéria ou conceito trouxe dificuldade? Você pode levar essa pergunta ao docente abaixo.";
  if (/nota|feedback|avali/.test(text))
    return "Veja o feedback recente abaixo e compare sua resposta com as orientações. Se ainda houver dúvida, cite a atividade ao escrever ao docente. A nota só pode ser alterada por um responsável autorizado.";
  return "Posso orientar sobre estudo, matrícula, acesso e feedback. Conte qual desses assuntos está envolvido. Para uma resposta específica ao conteúdo da aula, envie sua dúvida ao docente vinculado à turma.";
}
export function AcademicSupport() {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    [question, setQuestion] = useState(""),
    [conversation, setConversation] = useState<
      { question: string; answer: string }[]
    >([]),
    [teacherId, setTeacherId] = useState(""),
    [feedbackId, setFeedbackId] = useState(""),
    [panel, setPanel] = useState<"" | "faq" | "ticket">("");
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
  ]
    .map((id) => repo.data.profiles.find((p) => p.id === id))
    .filter((p) => !!p);
  const feedbacks = repo.data.submissions
    .filter((s) => s.student_id === auth.id && s.status === "reviewed")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const feedback = feedbacks.find((s) => s.id === feedbackId),
    teacher = teachers.find((p) => p.id === teacherId);
  function ask(text: string) {
    if (!text.trim()) return;
    setConversation((old) => [
      ...old.slice(-5),
      { question: text.trim(), answer: academicAnswer(text) },
    ]);
    setQuestion("");
  }
  if (auth.role !== "estudante")
    return (
      <div className="stack">
        <Heading title="Central de suporte" />
        {auth.role === "docente" && <SupportQueue />}
        <Card>
          <SupportHistory />
        </Card>
        <Card>
          <FAQ />
        </Card>
      </div>
    );
  return (
    <div className="stack academic-support">
      <Heading
        title="Suporte acadêmico"
        description="Orientação para estudar e conversar com seus docentes."
      />
      <div className="support-grid">
        <Card className="academic-assistant">
          <h2>Assistente IA</h2>
          <p>Orientações rápidas para sua jornada de estudos.</p>
          <p className="small">
            Versão demonstrativa com respostas locais por assunto. IA generativa
            e atendimento humano não estão conectados a este assistente.
          </p>
          <div className="quick-questions">
            {[
              "Como trocar de curso?",
              "Esqueci minha senha",
              "Como organizar meus estudos?",
            ].map((q) => (
              <Button variant="outline" key={q} onClick={() => ask(q)}>
                {q}
              </Button>
            ))}
            <Button variant="outline" onClick={() => setPanel("faq")}>
              FAQs Gerais
            </Button>
          </div>
          {!!conversation.length && (
            <div
              className="academic-log"
              role="log"
              aria-label="Orientações acadêmicas"
              aria-live="polite"
            >
              {conversation.map((m, i) => (
                <div key={i}>
                  <strong>{m.question}</strong>
                  <p>{m.answer}</p>
                </div>
              ))}
            </div>
          )}
          <form
            className="chat-compose"
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <label className="sr-only" htmlFor="academic-question">
              Dúvida acadêmica
            </label>
            <textarea
              id="academic-question"
              placeholder="Digite sua dúvida aqui…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1000}
              required
            />
            <Button type="submit" icon="send" disabled={!question.trim()}>
              Enviar
            </Button>
          </form>
        </Card>
        <div className="stack">
          {teachers.map((t) => (
            <Card key={t.id}>
              <div className="teacher-heading">
                <Avatar
                  name={t.full_name}
                  path={t.avatar_path}
                  demoImage={t.avatar_demo || "/assets/story-4.svg"}
                />
                <div>
                  <h3>{t.full_name}</h3>
                  <p className="small">
                    {String(
                      t.preferences.office_hours ||
                        "Horário de atendimento não informado",
                    )}
                  </p>
                </div>
              </div>
              <Badge>{t.headline || "Docente da sua turma"}</Badge>
              <p className="small muted">
                {auth.demo
                  ? "Perfil ilustrativo · envio local demonstrativo"
                  : "Mensagens disponíveis · presença online não informada"}
              </p>
              <Button icon="message" onClick={() => setTeacherId(t.id)}>
                Enviar Mensagem
              </Button>
            </Card>
          ))}
          {!teachers.length && (
            <Empty title="Nenhum docente vinculado">
              Sua instituição precisa associar sua matrícula a uma turma. Não há
              atendimento humano disponível nesta tela.
            </Empty>
          )}
          <Card>
            <div className="row-between">
              <h2>Feedback recente</h2>
              {feedbacks[0] && <Badge>Nota {feedbacks[0].grade}</Badge>}
            </div>
            {feedbacks[0] ? (
              <>
                <strong className="small">
                  {repo.data.assignments.find(
                    (a) => a.id === feedbacks[0].assignment_id,
                  )?.title || "Atividade avaliada"}
                </strong>
                <p className="feedback-excerpt">{feedbacks[0].feedback}</p>
                <Button
                  variant="outline"
                  onClick={() => setFeedbackId(feedbacks[0].id)}
                >
                  Ver feedback completo
                </Button>
              </>
            ) : (
              <p>
                Quando um docente avaliar sua atividade, a nota e as orientações
                aparecerão aqui.
              </p>
            )}
          </Card>
        </div>
      </div>
      <div className="help-center">
        <Button variant="ghost" icon="chevron" onClick={() => setPanel("faq")}>
          Central de Ajuda
        </Button>
        <Button
          variant="ghost"
          icon="chevron"
          onClick={() => setPanel("ticket")}
        >
          Abrir Chamado Técnico
        </Button>
        <ActionLink to="/app/atividades" variant="ghost">
          Orientação e atividades da turma
        </ActionLink>
      </div>
      <Card className="study-tip">
        <h3>
          <Icon name="book" /> Dica do dia
        </h3>
        <p>
          Ao pedir ajuda, descreva o que tentou e onde surgiu a dúvida. Um
          exemplo facilita a orientação do docente.
        </p>
      </Card>
      <SupportHistory />
      {teacher && (
        <Modal
          title={`Mensagem para ${teacher.full_name}`}
          onClose={() => setTeacherId("")}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const body = String(
                new FormData(e.currentTarget).get("body"),
              ).trim();
              void action.run(
                async () => {
                  await repo.add("messages", {
                    id: uid(),
                    sender_id: auth.id!,
                    recipient_id: teacher.id,
                    body,
                    created_at: new Date().toISOString(),
                  });
                  setTeacherId("");
                },
                auth.demo
                  ? "Mensagem salva somente na demonstração. Nenhum docente real recebeu o conteúdo."
                  : "Mensagem registrada na conversa do docente. Isso não confirma leitura ou resposta.",
              );
            }}
          >
            {auth.demo && (
              <Notice>Envio demonstrativo, armazenado neste navegador.</Notice>
            )}
            <label>
              Sua mensagem ao docente
              <textarea
                name="body"
                rows={5}
                maxLength={4000}
                minLength={3}
                required
              />
            </label>
            <Button type="submit" disabled={action.busy}>
              Confirmar envio
            </Button>
            <ActionFeedback action={action} />
          </form>
          <ActionLink variant="ghost" to={`/app/mensagens?para=${teacher.id}`}>
            Abrir conversa e histórico
          </ActionLink>
        </Modal>
      )}
      {feedback && (
        <Modal title="Feedback completo" onClose={() => setFeedbackId("")}>
          <Badge>Nota {feedback.grade}</Badge>
          <h3>
            {
              repo.data.assignments.find((a) => a.id === feedback.assignment_id)
                ?.title
            }
          </h3>
          <h4>Comentário do docente</h4>
          <p className="pre-wrap">{feedback.feedback}</p>
          <h4>Sua resposta</h4>
          <p className="pre-wrap">{feedback.body}</p>
          <ActionLink to="/app/atividades" variant="outline">
            Ver atividades da turma
          </ActionLink>
        </Modal>
      )}
      {panel === "faq" && (
        <Modal title="Central de ajuda" onClose={() => setPanel("")}>
          <FAQ />
        </Modal>
      )}
      {panel === "ticket" && (
        <Modal title="Registrar dúvida técnica" onClose={() => setPanel("")}>
          <Notice>
            O registro fica no seu histórico. Depois você pode compartilhá-lo
            com um docente vinculado. Não existe central técnica externa
            conectada.
          </Notice>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void action.run(async () => {
                await repo.add("support_tickets", {
                  id: uid(),
                  user_id: auth.id!,
                  topic: String(f.get("topic")),
                  summary: String(f.get("summary")),
                  urgency: String(f.get("urgency")),
                  assigned_to: null,
                  response: null,
                  status: "open",
                  created_at: new Date().toISOString(),
                });
                setPanel("");
              }, "Dúvida registrada no seu histórico. Nenhum chamado foi enviado a uma equipe externa.");
            }}
          >
            <label>
              Assunto
              <input name="topic" required maxLength={80} />
            </label>
            <label>
              Descreva o problema
              <textarea
                name="summary"
                required
                minLength={10}
                maxLength={4000}
              />
            </label>
            <label>
              Urgência
              <select name="urgency">
                <option>Baixa</option>
                <option>Média</option>
                <option>Alta</option>
              </select>
            </label>
            <Button type="submit" disabled={action.busy}>
              Salvar no histórico
            </Button>
            <ActionFeedback action={action} />
          </form>
        </Modal>
      )}
      <ActionFeedback action={action} />
    </div>
  );
}
