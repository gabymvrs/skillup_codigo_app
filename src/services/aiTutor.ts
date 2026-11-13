import { requireSupabase } from "./supabase";

export const aiTutorEnabled = import.meta.env.VITE_AI_TUTOR_ENABLED === "true";

export interface TutorMessage {
  role: "user" | "model";
  text: string;
}

export async function askTutor(
  messages: TutorMessage[],
  subject?: string,
): Promise<string> {
  const recent = messages
    .filter((message) => message.text.trim())
    .slice(-4)
    .map((message) => ({
      role: message.role,
      text: message.text.trim().slice(0, 2000),
    }));
  const { data, error } = await requireSupabase().functions.invoke("ai-tutor", {
    body: {
      messages: recent,
      subject: subject?.trim().slice(0, 120) || undefined,
    },
  });
  if (error) {
    const response = (error as { context?: Response }).context;
    const status = response?.status;
    if (status === 429)
      throw new Error(
        "O tutor está temporariamente indisponível por limite de uso. Tente novamente em alguns minutos.",
      );
    if (response) {
      const detail = await response
        .clone()
        .json()
        .catch(() => null);
      if (detail?.error && typeof detail.error === "string")
        throw new Error(detail.error.slice(0, 240));
    }
    throw new Error(
      "Não foi possível falar com o tutor agora. Tente novamente.",
    );
  }
  if (!data?.answer || typeof data.answer !== "string")
    throw new Error(
      "O tutor não conseguiu preparar uma resposta. Tente reformular a pergunta.",
    );
  return data.answer.trim();
}
