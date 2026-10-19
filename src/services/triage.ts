import { normalize } from "../lib/utils";
export type Topic =
  | "Conta e acesso"
  | "Aprendizagem"
  | "Carreira"
  | "Suporte técnico"
  | "Instituição"
  | "Outros";
export interface ChatMessage {
  who: "bot" | "user";
  text: string;
}
export interface Triage {
  stage: "topic" | "detail" | "urgency" | "done";
  topic: Topic;
  detail: string;
  urgency: string;
  messages: ChatMessage[];
}
export const initialTriage = (): Triage => ({
  stage: "topic",
  topic: "Outros",
  detail: "",
  urgency: "Não informada",
  messages: [
    {
      who: "bot",
      text: "Olá! Sou o bot de triagem do SkillUp. Posso organizar sua dúvida e sugerir próximos passos. Não há atendente humano conectado. Qual é a sua dúvida?",
    },
  ],
});
const intents: Record<Exclude<Topic, "Outros">, string[]> = {
  "Conta e acesso": ["senha", "login", "e-mail", "email", "conta", "cadastro"],
  Aprendizagem: [
    "aula",
    "trilha",
    "atividade",
    "progresso",
    "material",
    "modulo",
    "certificado",
  ],
  Carreira: ["vaga", "estagio", "curriculo", "emprego", "candidatura"],
  "Suporte técnico": [
    "erro",
    "bug",
    "travou",
    "falha",
    "internet",
    "offline",
    "carrega",
  ],
  Instituição: ["matricula", "turma", "instituicao", "secretaria", "professor"],
};
export function classify(text: string): Topic {
  const source = normalize(text);
  const scores = Object.entries(intents)
    .map(([topic, words]) => ({
      topic: topic as Topic,
      score: words.filter((w) => source.includes(w)).length,
    }))
    .sort((a, b) => b.score - a.score);
  return scores[0].score ? scores[0].topic : "Outros";
}
export function advice(topic: Topic) {
  return {
    "Conta e acesso":
      "Confira o e-mail. Para recuperar a senha, use “Esqueci minha senha” na tela de login. Nunca compartilhe a sua senha.",
    Aprendizagem:
      "Abra Aprenda e confira o módulo, os pré-requisitos e a conexão. Materiais salvos no app ficam em Biblioteca offline.",
    Carreira:
      "Abra Emprego → Minhas candidaturas. Uma vaga externa deve ser concluída no site da empresa; o SkillUp não confirma o envio externo.",
    "Suporte técnico":
      "Anote a tela e a mensagem do erro. Verifique a conexão e tente novamente. Evite apagar dados do navegador antes de exportar materiais importantes.",
    Instituição:
      "Matrículas, documentos e mudança de turma dependem da instituição. Use este resumo ao procurar sua secretaria ou coordenação.",
    Outros:
      "Descreva o que você tentou fazer e o que aconteceu. O resumo abaixo pode ser levado ao canal oficial da sua instituição.",
  }[topic];
}
export function advance(state: Triage, input: string): Triage {
  const text = input.trim().slice(0, 1000);
  if (!text) return state;
  let next = {
    ...state,
    messages: [...state.messages, { who: "user" as const, text }],
  };
  if (state.stage === "topic") {
    next.topic = classify(text);
    next.detail = text;
    next.stage = "detail";
    next.messages.push({
      who: "bot",
      text: `Entendi: ${next.topic}. Em qual tela isso acontece e o que você já tentou?`,
    });
  } else if (state.stage === "detail") {
    next.detail += `\nDetalhes: ${text}`;
    next.stage = "urgency";
    next.messages.push({
      who: "bot",
      text: "Isso impede uma entrega hoje, dificulta seus estudos ou é uma dúvida sem prazo?",
    });
  } else if (state.stage === "urgency") {
    const n = normalize(text);
    next.urgency = /hoje|urgente|impede|agora/.test(n)
      ? "Alta"
      : /dificulta|semana/.test(n)
        ? "Média"
        : "Baixa";
    next.stage = "done";
    next.messages.push({
      who: "bot",
      text: `Prioridade: ${next.urgency}. ${advice(next.topic)} Seu resumo está pronto. Nenhum chamado foi enviado.`,
    });
  } else {
    next.messages.push({
      who: "bot",
      text: "Este atendimento já tem um resumo. Reinicie para organizar uma nova dúvida.",
    });
  }
  next.messages = next.messages.slice(-20);
  return next;
}
export function summary(state: Triage) {
  return `Resumo de triagem SkillUp\nAssunto: ${state.topic}\nUrgência: ${state.urgency}\nRelato: ${state.detail}\nOrientação: ${advice(state.topic)}\nNenhum atendimento humano ou envio externo confirmado.`;
}
